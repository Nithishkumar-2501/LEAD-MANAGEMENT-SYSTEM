import { NextResponse } from "next/server";
import { askVirtualCounselor, generateOutreachPitch } from "@/lib/ai/counselorKnowledge";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, query, channel, studentContext } = body;

    if (action === "GENERATE_PITCH") {
      const pitch = generateOutreachPitch(channel || "WHATSAPP", studentContext || {});
      return NextResponse.json({ success: true, pitch });
    }

    // Default: chat query
    const response = askVirtualCounselor(query || "Tell me about admissions", studentContext);
    return NextResponse.json({ success: true, response });
  } catch (error: any) {
    console.error("AI Counselor Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process counselor request" },
      { status: 500 }
    );
  }
}
