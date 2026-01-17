import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAllInterviews = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const interviews = await ctx.db.query("interviews").collect();

    return interviews;
  },
});

export const getMyInterviews = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    // Get all interviews
    const allInterviews = await ctx.db.query("interviews").collect();
    
    // Filter to include interviews where user is candidate OR interviewer
    const myInterviews = allInterviews.filter(
      (interview) =>
        interview.candidateId === identity.subject ||
        interview.interviewerIds.includes(identity.subject)
    );

    return myInterviews;
  },
});

export const getInterviewByStreamCallId = query({
  args: { streamCallId: v.string() },
  handler: async (ctx, args) => {
    if (!args.streamCallId) return null;
    
    const interview = await ctx.db
      .query("interviews")
      .withIndex("by_stream_call_id", (q) => q.eq("streamCallId", args.streamCallId))
      .first();
    
    return interview || null;
  },
});

export const createInterview = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    status: v.string(),
    streamCallId: v.string(),
    candidateId: v.string(),
    interviewerIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    console.log("Creating interview with args:", {
      title: args.title,
      streamCallId: args.streamCallId,
      candidateId: args.candidateId,
      interviewerIds: args.interviewerIds,
    });

    const result = await ctx.db.insert("interviews", {
      ...args,
    });

    console.log("Interview created with ID:", result);
    return result;
  },
});

export const updateInterviewStatus = mutation({
  args: {
    id: v.id("interviews"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      status: args.status,
      ...(args.status === "completed" ? { endTime: Date.now() } : {}),
    });
  },
});

export const updateInterviewCandidate = mutation({
  args: {
    streamCallId: v.string(),
    candidateId: v.string(),
  },
  handler: async (ctx, args) => {
    const interview = await ctx.db
      .query("interviews")
      .withIndex("by_stream_call_id", (q) => q.eq("streamCallId", args.streamCallId))
      .first();

    if (!interview) return null;

    // Only update if candidate is not already set or is empty
    if (!interview.candidateId || interview.candidateId === "") {
      await ctx.db.patch(interview._id, {
        candidateId: args.candidateId,
      });
    }

    return interview._id;
  },
});

export const updateInterviewRating = mutation({
  args: {
    id: v.id("interviews"),
    rating: v.union(v.literal("pass"), v.literal("fail")),
    interviewerNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db.patch(args.id, {
      rating: args.rating,
      status: args.rating === "pass" ? "succeeded" : "failed",
      endTime: Date.now(),
      ...(args.interviewerNotes ? { interviewerNotes: args.interviewerNotes } : {}),
    });
  },
});

export const getInterviewDetails = query({
  args: { interviewId: v.id("interviews") },
  handler: async (ctx, args) => {
    const interview = await ctx.db.get(args.interviewId);
    if (!interview) return null;

    console.log("Fetching interview details for:", {
      interviewId: args.interviewId,
      streamCallId: interview.streamCallId,
    });

    // Get submissions for this interview
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_stream_call_id", (q) => q.eq("streamCallId", interview.streamCallId))
      .collect();

    console.log(`Found ${submissions.length} submissions for interview`);

    // Get assigned question
    const questionAssignment = await ctx.db
      .query("questionAssignments")
      .withIndex("by_stream_call_id", (q) => q.eq("streamCallId", interview.streamCallId))
      .first();

    return {
      interview,
      submissions,
      questionAssignment,
    };
  },
});

export const getAssignedQuestion = query({
  args: { streamCallId: v.string() },
  handler: async (ctx, args) => {
    if (!args.streamCallId) return null;
    
    return await ctx.db
      .query("questionAssignments")
      .withIndex("by_stream_call_id", (q) => q.eq("streamCallId", args.streamCallId))
      .first();
  },
});

export const assignQuestion = mutation({
  args: {
    streamCallId: v.string(),
    questionId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error("Unauthorized");

      if (!args.streamCallId || args.streamCallId === "undefined") {
        throw new Error("Invalid meeting ID");
      }

      // Check if already assigned
      const existing = await ctx.db
        .query("questionAssignments")
        .withIndex("by_stream_call_id", (q) => q.eq("streamCallId", args.streamCallId))
        .first();

      if (existing) {
        // Update existing assignment
        return await ctx.db.patch(existing._id, {
          questionId: args.questionId,
          assignedAt: Date.now(),
        });
      }

      // Create new assignment
      return await ctx.db.insert("questionAssignments", {
        streamCallId: args.streamCallId,
        questionId: args.questionId,
        assignedAt: Date.now(),
      });
    } catch (error) {
      console.error("assignQuestion error:", error);
      throw error;
    }
  },
});

export const submitSolution = mutation({
  args: {
    streamCallId: v.string(),
    questionId: v.string(),
    code: v.string(),
    language: v.string(),
    testResults: v.optional(v.array(v.object({
      testName: v.string(),
      passed: v.boolean(),
      expected: v.string(),
      actual: v.string(),
    }))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    console.log("Backend: Submitting solution for:", {
      streamCallId: args.streamCallId,
      questionId: args.questionId,
      userId: identity.subject,
      testResultsCount: args.testResults?.length || 0,
    });

    const allTestsPassed = args.testResults?.every(r => r.passed) ?? false;

    const submissionId = await ctx.db.insert("submissions", {
      streamCallId: args.streamCallId,
      questionId: args.questionId,
      code: args.code,
      language: args.language,
      submittedBy: identity.subject,
      submittedAt: Date.now(),
      testResults: args.testResults,
      status: allTestsPassed ? "passed" : "failed",
    });

    console.log("Backend: Submission created with ID:", submissionId);
    return submissionId;
  },
});

export const getSubmissions = query({
  args: { streamCallId: v.string() },
  handler: async (ctx, args) => {
    if (!args.streamCallId) return [];
    
    return await ctx.db
      .query("submissions")
      .withIndex("by_stream_call_id", (q) => q.eq("streamCallId", args.streamCallId))
      .collect();
  },
});

export const updateSubmissionResults = mutation({
  args: {
    submissionId: v.id("submissions"),
    testResults: v.array(v.object({
      testName: v.string(),
      passed: v.boolean(),
      expected: v.string(),
      actual: v.string(),
    })),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db.patch(args.submissionId, {
      testResults: args.testResults,
      status: args.status,
    });
  },
});
