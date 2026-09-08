import { NextResponse } from "next/server";
import { analyzeCallTranscript } from "@/lib/ai/callSentimentEngine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { transcript, studentName } = body;
    const analysis = analyzeCallTranscript(transcript, studentName);
    return NextResponse.json({ success: true, analysis });
  } catch (error: any) {
    console.error("Call Analysis Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to analyze call audio/transcript" },
      { status: 500 }
    );
  }
}
