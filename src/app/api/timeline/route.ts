import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveStudentToFirebase } from "@/lib/firebaseSync";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("leadId");

    if (!leadId) {
      const allEvents = await prisma.timelineEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return NextResponse.json(allEvents);
    }

    const events = await prisma.timelineEvent.findMany({
      where: { leadId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(events);
  } catch (error: any) {
    console.error("GET /api/timeline error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      leadId,
      type = "CALL",
      title,
      timestamp,
      rawDate,
      durationText,
      durationSeconds,
      description,
      authorName,
      authorId,
      authorRole,
      status = "CONNECTED",
      scoreDelta,
      studentInterest,
      teacherNotes,
      callTranscript,
      audioUrl,
    } = body;

    if (!leadId || !title) {
      return NextResponse.json(
        { error: "leadId and title are required fields" },
        { status: 400 }
      );
    }

    const now = new Date();
    const validRawDate = rawDate || now.toISOString().split("T")[0];
    const validTimestamp =
      timestamp ||
      `${now.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })} ${now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}`;

    const createdEvent = await prisma.timelineEvent.create({
      data: {
        leadId: String(leadId),
        type,
        title,
        timestamp: validTimestamp,
        rawDate: validRawDate,
        durationText: durationText || null,
        durationSeconds: durationSeconds ? Number(durationSeconds) : null,
        description: description || "",
        authorName: authorName || "Faculty Mentor",
        authorId: authorId || null,
        authorRole: authorRole || null,
        status: status || "CONNECTED",
        scoreDelta: scoreDelta ? Number(scoreDelta) : null,
        studentInterest: studentInterest || null,
        teacherNotes: teacherNotes || null,
        callTranscript: callTranscript || null,
        audioUrl: audioUrl || null,
      },
    });

    console.log(`📞 [Timeline DB] Saved live event to SQLite: ${createdEvent.id} for lead ${leadId}`);

    return NextResponse.json(createdEvent, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/timeline error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to persist timeline event" },
      { status: 500 }
    );
  }
}
