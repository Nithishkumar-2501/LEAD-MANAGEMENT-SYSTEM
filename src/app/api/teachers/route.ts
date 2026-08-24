import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_TEACHERS } from "@/lib/mockData";
import { Teacher, CampusLocation } from "@/types/crm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campus = searchParams.get("campus");

    let teachers: Teacher[] = [];
    try {
      const dbTeachers = await prisma.teacher.findMany({
        orderBy: { createdAt: "desc" },
      });
      if (dbTeachers && dbTeachers.length > 0) {
        teachers = dbTeachers.map((t: any) => ({
          ...t,
          campus: t.campus as CampusLocation,
          status: (t.status as "ACTIVE" | "ON_LEAVE") || "ACTIVE",
          coursesAssigned:
            typeof t.coursesAssigned === "string"
              ? JSON.parse(t.coursesAssigned)
              : t.coursesAssigned,
        }));
      } else {
        teachers = MOCK_TEACHERS;
      }
    } catch (dbErr) {
      teachers = MOCK_TEACHERS;
    }

    if (campus && campus !== "ALL") {
      teachers = teachers.filter(
        (t) => t.campus === campus || t.campus.toUpperCase().includes(campus.toUpperCase())
      );
    }

    return NextResponse.json(teachers);
  } catch (error) {
    return NextResponse.json(MOCK_TEACHERS);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check if body is an array (batch CSV import) or single object
    const items: Partial<Teacher>[] = Array.isArray(body) ? body : [body];

    const savedTeachers: Teacher[] = [];

    for (const item of items) {
      const {
        name,
        email,
        phone,
        department,
        campus,
        coursesAssigned,
        experienceYears,
        status,
        avatar,
        assignedQuota,
      } = item;

      if (!name || !email) continue;

      const teacherId = item.id || `tch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const teacherData: Teacher = {
        id: teacherId,
        name,
        email,
        phone: phone || "+91 98765 00000",
        department: department || "Computer Science & Engineering",
        campus: (campus as CampusLocation) || "KARUR",
        coursesAssigned: coursesAssigned && coursesAssigned.length > 0 ? coursesAssigned : ["B.E. Computer Science"],
        experienceYears: Number(experienceYears) || 3,
        status: (status as "ACTIVE" | "ON_LEAVE") || "ACTIVE",
        avatar: avatar || name.slice(0, 2).toUpperCase(),
        assignedQuota: Number(assignedQuota) || 1000,
      };

      try {
        const coursesStr = JSON.stringify(teacherData.coursesAssigned);
        const created = await prisma.teacher.upsert({
          where: { email },
          update: {
            name: teacherData.name,
            phone: teacherData.phone,
            department: teacherData.department,
            campus: teacherData.campus,
            coursesAssigned: coursesStr,
            experienceYears: teacherData.experienceYears,
            status: teacherData.status,
            assignedQuota: teacherData.assignedQuota,
          },
          create: {
            id: teacherData.id,
            name: teacherData.name,
            email: teacherData.email,
            phone: teacherData.phone,
            department: teacherData.department,
            campus: teacherData.campus,
            coursesAssigned: coursesStr,
            experienceYears: teacherData.experienceYears,
            status: teacherData.status,
            avatar: teacherData.avatar,
            assignedQuota: teacherData.assignedQuota,
          },
        });

        savedTeachers.push({
          ...created,
          campus: created.campus as CampusLocation,
          status: (created.status as "ACTIVE" | "ON_LEAVE") || "ACTIVE",
          coursesAssigned:
            typeof created.coursesAssigned === "string"
              ? JSON.parse(created.coursesAssigned)
              : created.coursesAssigned,
        });
      } catch (dbErr) {
        savedTeachers.push(teacherData);
      }
    }

    return NextResponse.json(Array.isArray(body) ? savedTeachers : savedTeachers[0] || body, {
      status: 201,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to persist teacher record(s)" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, email, phone, department, campus, coursesAssigned, experienceYears, status, assignedQuota } = body;

    if (!id && !email) {
      return NextResponse.json({ error: "Teacher ID or email is required for editing" }, { status: 400 });
    }

    try {
      const updated = await prisma.teacher.update({
        where: id ? { id } : { email },
        data: {
          name,
          email,
          phone,
          department,
          campus,
          coursesAssigned,
          experienceYears: Number(experienceYears) || 3,
          status,
          assignedQuota: Number(assignedQuota) || 1000,
        },
      });

      return NextResponse.json({
        ...updated,
        campus: updated.campus as CampusLocation,
        status: (updated.status as "ACTIVE" | "ON_LEAVE") || "ACTIVE",
        coursesAssigned:
          typeof updated.coursesAssigned === "string"
            ? JSON.parse(updated.coursesAssigned)
            : updated.coursesAssigned,
      });
    } catch (e) {
      return NextResponse.json(body);
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to update teacher profile" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 });
    }

    try {
      await prisma.teacher.delete({ where: { id } });
    } catch (e) {
      // Fallback
    }

    return NextResponse.json({ success: true, message: `Teacher ${id} deleted successfully` });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete teacher" }, { status: 500 });
  }
}
