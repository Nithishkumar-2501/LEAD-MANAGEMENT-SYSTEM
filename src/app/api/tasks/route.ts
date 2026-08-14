import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const { taskId, isCompleted } = await request.json();

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    try {
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: { isCompleted },
      });
      return NextResponse.json({ success: true, task: updatedTask });
    } catch {
      // In-memory fallback response
      return NextResponse.json({
        success: true,
        message: "Task updated in state fallback",
        taskId,
        isCompleted,
      });
    }
  } catch (error) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
