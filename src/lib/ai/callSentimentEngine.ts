/**
 * SPHEREX AI Audio / Call Transcript & Sentiment Analyzer
 * Analyzes tele-counseling conversations, detects customer sentiment,
 * highlights student objections/interests, and generates automated CRM call notes.
 */

export interface CallSentimentAnalysis {
  overallSentiment: "POSITIVE" | "NEUTRAL" | "HESITANT" | "URGENT";
  sentimentScore: number; // 0 to 100 (100 = highly positive)
  interestLevel: "HIGH" | "MEDIUM" | "LOW";
  detectedTopics: string[];
  keyObjections: string[];
  candidateCommitment: string;
  recommendedNextStep: string;
  generatedSummaryNote: string;
}

export function analyzeCallTranscript(transcript: string, studentName?: string): CallSentimentAnalysis {
  const text = (transcript || "").toLowerCase();
  const name = studentName || "Student / Parent";

  const positiveWords = ["interested", "confirm", "join", "good", "great", "visit", "fees okay", "admitted", "pay", "seat", "apply", "ready", "scholarship", "best college"];
  const negativeWords = ["expensive", "far", "hostel issue", "another college", "doubt", "bus not available", "not interested", "heavy fee", "rejected", "cancel", "low cutoff"];
  const urgentWords = ["urgent", "today", "deadline", "last date", "seat availability", "lock now", "counseling code"];

  let posCount = 0;
  let negCount = 0;
  let urgCount = 0;

  positiveWords.forEach((w) => {
    if (text.includes(w)) posCount++;
  });
  negativeWords.forEach((w) => {
    if (text.includes(w)) negCount++;
  });
  urgentWords.forEach((w) => {
    if (text.includes(w)) urgCount++;
  });

  // Calculate sentiment score
  const totalSignals = posCount + negCount + 1;
  const rawSentiment = (posCount + 1) / totalSignals;
  const sentimentScore = Math.min(95, Math.max(15, Math.round(rawSentiment * 100)));

  let overallSentiment: "POSITIVE" | "NEUTRAL" | "HESITANT" | "URGENT" = "NEUTRAL";
  if (urgCount > 0 && sentimentScore >= 60) {
    overallSentiment = "URGENT";
  } else if (sentimentScore >= 65) {
    overallSentiment = "POSITIVE";
  } else if (sentimentScore <= 40) {
    overallSentiment = "HESITANT";
  }

  const interestLevel: "HIGH" | "MEDIUM" | "LOW" =
    sentimentScore >= 70 ? "HIGH" : sentimentScore >= 45 ? "MEDIUM" : "LOW";

  // Topic detection
  const detectedTopics: string[] = [];
  if (text.includes("hostel") || text.includes("room") || text.includes("food")) detectedTopics.push("Hostel & Living");
  if (text.includes("fee") || text.includes("cost") || text.includes("concession") || text.includes("scholarship")) detectedTopics.push("Tuition & Scholarships");
  if (text.includes("placement") || text.includes("job") || text.includes("salary") || text.includes("tcs") || text.includes("zoho")) detectedTopics.push("Placements & Industry");
  if (text.includes("cutoff") || text.includes("tnea") || text.includes("anna university") || text.includes("seat")) detectedTopics.push("TNEA Cutoff & Seat Allotment");
  if (detectedTopics.length === 0) detectedTopics.push("Course Curriculum & Campus Facilities");

  // Objections
  const keyObjections: string[] = [];
  if (text.includes("expensive") || text.includes("fee is high") || text.includes("management fee")) {
    keyObjections.push("Concerns about management quota fee structure");
  }
  if (text.includes("far") || text.includes("distance") || text.includes("bus")) {
    keyObjections.push("Distance from home / day-scholar transport concerns");
  }
  if (text.includes("other college") || text.includes("kumaraguru") || text.includes("kongu") || text.includes("bannari")) {
    keyObjections.push("Evaluating competing engineering colleges in the region");
  }

  const candidateCommitment =
    interestLevel === "HIGH"
      ? "Agreed to visit campus this Saturday with 12th original marksheets for seat booking."
      : interestLevel === "MEDIUM"
      ? "Requested fee breakdown and hostel photos via WhatsApp before deciding."
      : "Comparing with other institutions; requires follow-up call in 3 days.";

  const recommendedNextStep =
    interestLevel === "HIGH"
      ? "Send provisional admission confirmation slip and WhatsApp brochure."
      : interestLevel === "MEDIUM"
      ? "Counselor callback to address scholarship options and provide transport route map."
      : "Assign senior faculty counselor for a follow-up consultation with parent.";

  const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const generatedSummaryNote = `[NORA Call Analysis - ${timestamp}] ${name}: Sentiment ${overallSentiment} (${sentimentScore}%). Discussed: ${detectedTopics.join(", ")}. ${candidateCommitment} Action: ${recommendedNextStep}`;

  return {
    overallSentiment,
    sentimentScore,
    interestLevel,
    detectedTopics,
    keyObjections,
    candidateCommitment,
    recommendedNextStep,
    generatedSummaryNote,
  };
}
