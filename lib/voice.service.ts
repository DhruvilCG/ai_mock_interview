type VoiceServiceCallback = (data?: any) => void;

interface VoiceServiceConfig {
  onCallStart?: VoiceServiceCallback;
  onCallEnd?: VoiceServiceCallback;
  onMessage?: (message: any) => void;
  onSpeechStart?: VoiceServiceCallback;
  onSpeechEnd?: VoiceServiceCallback;
  onError?: (error: Error) => void;
}

class VoiceService {
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private isActive = false;
  private isSpeaking = false;
  private callbacks: VoiceServiceConfig = {};
  private messages: Array<{ role: string; content: string }> = [];
  private conversationHistory: Array<{ role: string; content: string }> = [];
  private systemPrompt = "";
  private interviewQuestions: string[] = [];
  private currentQuestionIndex = 0;
  private apiKey = "";
  private silenceTimeout: NodeJS.Timeout | null = null;
  private lastTranscript = "";

  constructor() {
    if (typeof window !== "undefined") {
      // Initialize Web Speech API
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = "en-US"; // US English
        
        this.setupRecognitionHandlers();
      }
      
      // Use browser's native speech synthesis
      this.synthesis = window.speechSynthesis;
    }
  }

  private setupRecognitionHandlers() {
    if (!this.recognition) return;

    let isProcessing = false;

    this.recognition.onstart = () => {
      console.log("Speech recognition started");
      isProcessing = false;
    };

    this.recognition.onresult = (event: any) => {
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        }
      }

      if (finalTranscript && !isProcessing) {
        isProcessing = true;
        this.lastTranscript = finalTranscript.trim();
        console.log("Final transcript:", this.lastTranscript);
        
        // Stop recognition immediately
        this.recognition.stop();
        
        // Process after a small delay
        setTimeout(() => {
          this.handleUserInput(this.lastTranscript);
        }, 500);
      }
    };

    this.recognition.onerror = (event: any) => {
      if (event.error === "no-speech" || event.error === "audio-capture") {
        return; // Silently ignore these errors
      }
      console.error("Speech recognition error:", event.error);
    };

    this.recognition.onend = () => {
      console.log("Speech recognition ended");
      // Don't auto-restart, let the AI response handler restart it
    };
  }

  private async handleUserInput(transcript: string) {
    console.log("User said:", transcript);
    
    // Add user message to history
    this.conversationHistory.push({ role: "user", content: transcript });
    
    // Trigger message callback
    this.callbacks.onMessage?.({
      type: "transcript",
      transcriptType: "final",
      role: "user",
      transcript: transcript,
    });

    // Stop listening while AI responds
    if (this.recognition) {
      this.recognition.stop();
    }

    // Get AI response
    await this.getAIResponse(transcript);
  }

  private async getAIResponse(userInput: string) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: this.systemPrompt },
            ...this.conversationHistory,
          ],
          temperature: 0.7,
          max_tokens: 200,
        }),
      });

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || "I'm sorry, I didn't catch that.";
      
      // Add AI response to history
      this.conversationHistory.push({ role: "assistant", content: aiResponse });
      
      // Trigger message callback
      this.callbacks.onMessage?.({
        type: "transcript",
        transcriptType: "final",
        role: "assistant",
        transcript: aiResponse,
      });

      // Speak the response
      await this.speak(aiResponse);
      
    } catch (error) {
      console.error("Error getting AI response:", error);
      this.callbacks.onError?.(error as Error);
    }
  }

  private speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synthesis) {
        resolve();
        return;
      }

      this.isSpeaking = true;
      this.callbacks.onSpeechStart?.();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.2; // Slightly higher pitch for classic AI voice
      utterance.volume = 1;
      utterance.lang = "en-US"; // English US

      // Try to use a female voice (classic AI voice)
      const voices = this.synthesis.getVoices();
      const femaleVoice = voices.find(
        (voice) =>
          voice.name.includes("Female") ||
          voice.name.includes("Samantha") ||
          voice.name.includes("Karen") ||
          voice.name.includes("Victoria") ||
          voice.name.includes("Zira") ||
          voice.name.includes("Jenny")
      );
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      } else {
        // Fallback to any English voice
        const englishVoice = voices.find((voice) => voice.lang.startsWith("en"));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
      }

      utterance.onend = () => {
        this.isSpeaking = false;
        this.callbacks.onSpeechEnd?.();
        
        // Resume listening after speaking (only if call is still active)
        if (this.isActive && this.recognition) {
          console.log("AI finished speaking, resuming recognition...");
          setTimeout(() => {
            this.recognition.start();
          }, 500);
        }
        
        resolve();
      };

      utterance.onerror = (error) => {
        console.error("Speech synthesis error:", error);
        this.isSpeaking = false;
        this.callbacks.onSpeechEnd?.();
        resolve();
      };

      this.synthesis.speak(utterance);
    });
  }

  async start(config: any, options?: { variableValues?: Record<string, any> }) {
    this.isActive = true;
    this.conversationHistory = [];
    this.apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || "";

    // Extract system prompt and questions from config
    if (typeof config === "object" && config.model?.messages) {
      this.systemPrompt = config.model.messages[0]?.content || "";
      
      // Replace variables in system prompt
      if (options?.variableValues?.questions) {
        this.systemPrompt = this.systemPrompt.replace(
          "{{questions}}",
          options.variableValues.questions
        );
      }
    }

    // Trigger call start
    this.callbacks.onCallStart?.();

    // Speak first message
    const firstMessage = config.firstMessage || "Hello! Let's begin the interview.";
    this.conversationHistory.push({ role: "assistant", content: firstMessage });
    
    this.callbacks.onMessage?.({
      type: "transcript",
      transcriptType: "final",
      role: "assistant",
      transcript: firstMessage,
    });

    await this.speak(firstMessage);
  }

  stop() {
    this.isActive = false;
    
    if (this.recognition) {
      this.recognition.stop();
    }
    
    if (this.synthesis) {
      this.synthesis.cancel();
    }

    this.callbacks.onCallEnd?.();
  }

  on(event: string, callback: VoiceServiceCallback) {
    switch (event) {
      case "call-start":
        this.callbacks.onCallStart = callback;
        break;
      case "call-end":
        this.callbacks.onCallEnd = callback;
        break;
      case "message":
        this.callbacks.onMessage = callback;
        break;
      case "speech-start":
        this.callbacks.onSpeechStart = callback;
        break;
      case "speech-end":
        this.callbacks.onSpeechEnd = callback;
        break;
      case "error":
        this.callbacks.onError = callback;
        break;
    }
  }

  off(event: string, callback: VoiceServiceCallback) {
    switch (event) {
      case "call-start":
        this.callbacks.onCallStart = undefined;
        break;
      case "call-end":
        this.callbacks.onCallEnd = undefined;
        break;
      case "message":
        this.callbacks.onMessage = undefined;
        break;
      case "speech-start":
        this.callbacks.onSpeechStart = undefined;
        break;
      case "speech-end":
        this.callbacks.onSpeechEnd = undefined;
        break;
      case "error":
        this.callbacks.onError = undefined;
        break;
    }
  }
}

export const voiceService = new VoiceService();
