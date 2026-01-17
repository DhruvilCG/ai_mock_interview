import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    role: v.union(v.literal("candidate"), v.literal("interviewer")),
    clerkId: v.string(),
  }).index("by_clerk_id", ["clerkId"]),

  interviews: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    status: v.string(),
    streamCallId: v.string(),
    candidateId: v.string(),
    interviewerIds: v.array(v.string()),
    rating: v.optional(v.union(v.literal("pass"), v.literal("fail"), v.literal("pending"))),
    interviewerNotes: v.optional(v.string()),
  })
    .index("by_candidate_id", ["candidateId"])
    .index("by_stream_call_id", ["streamCallId"]),

  questionAssignments: defineTable({
    streamCallId: v.string(),
    questionId: v.string(),
    assignedAt: v.number(),
  }).index("by_stream_call_id", ["streamCallId"]),

  submissions: defineTable({
    streamCallId: v.string(),
    questionId: v.string(),
    code: v.string(),
    language: v.string(),
    submittedBy: v.string(),
    submittedAt: v.number(),
    testResults: v.optional(v.array(v.object({
      testName: v.string(),
      passed: v.boolean(),
      expected: v.string(),
      actual: v.string(),
    }))),
    status: v.optional(v.string()), // "pending", "passed", "failed"
  })
    .index("by_stream_call_id", ["streamCallId"])
    .index("by_question_id", ["questionId"]),

  comments: defineTable({
    content: v.string(),
    rating: v.number(),
    interviewerId: v.string(),
    interviewId: v.id("interviews"),
  }).index("by_interview_id", ["interviewId"]),
});
