import { NextResponse } from "next/server";
import { parseMarksheetDocument } from "@/lib/ai/marksheetOcrEngine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = parseMarksheetDocument(body);
    return NextResponse.json({ success: true, marksheet: result });
  } catch (error: any) {
    console.error("Marksheet OCR Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process marksheet" },
      { status: 500 }
    );
  }
}
