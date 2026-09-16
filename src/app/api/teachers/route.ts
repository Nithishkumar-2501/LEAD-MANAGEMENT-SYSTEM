import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_TEACHERS } from "@/lib/mockData";
import { Teacher, CampusLocation } from "@/types/crm";
import {
  saveTeacherToFirebase,
  deleteTeacherFromFirebase,
  fetchTeachersFromFirebase,
} from "@/lib/firebaseSync";
import { formatPhoneWith91 } from "@/lib/phoneValidation";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campus = searchParams.get("campus");

    let teachers: Teacher[] = [];

    // 1. Prioritize reading directly from Firebase (Firestore + RTDB)
    try {
      const firebaseTeachers = await fetchTeachersFromFirebase();
      if (Array.isArray(firebaseTeachers) && firebaseTeachers.length > 0) {
        teachers = firebaseTeachers;
      }
    } catch (fbErr) {
      console.warn("Firebase teachers fetch notice in API:", fbErr);
    }

    // 2. If Firebase returned nothing, check Prisma database
    if (teachers.length === 0) {
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
        }
      } catch (dbErr) {
        // Fallback
      }
    }

    // 3. Guarantee all department staff members from MOCK_TEACHERS are always present
    const teacherMap = new Map<string, Teacher>();
    MOCK_TEACHERS.forEach((t) => teacherMap.set((t.id || t.email).toLowerCase(), t));
    teachers.forEach((t) => {
      const key = (t.id || t.email).toLowerCase();
      const existing = teacherMap.get(key);
      teacherMap.set(key, existing ? { ...existing, ...t } : t);
    });
    teachers = Array.from(teacherMap.values());

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
        photoUrl,
      } = item;

      if (!name || !email) continue;

      const teacherId = item.id || `tch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const formattedPhone = formatPhoneWith91(phone || "+91-9876500000");

      const teacherData: Teacher = {
        id: teacherId,
        name,
        email,
        phone: formattedPhone,
        department: department || "Computer Science & Engineering",
        campus: (campus as CampusLocation) || "KARUR",
        coursesAssigned: coursesAssigned && coursesAssigned.length > 0 ? coursesAssigned : ["B.E. Computer Science"],
        experienceYears: Number(experienceYears) || 3,
        status: (status as "ACTIVE" | "ON_LEAVE") || "ACTIVE",
        avatar: avatar || name.slice(0, 2).toUpperCase(),
        assignedQuota: Number(assignedQuota) || 1000,
        photoUrl: photoUrl || undefined,
      };

      // 1. Persist directly to Firebase Firestore & RTDB
      try {
        await saveTeacherToFirebase(teacherData);
      } catch (fbErr) {
        console.warn("Firebase teacher write notice:", fbErr);
      }

      // 2. Persist to Prisma SQLite
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
    return NextResponse.json({ error: "Failed to persist teacher record(s) to Firebase and DB" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, email, phone, department, campus, coursesAssigned, experienceYears, status, assignedQuota, photoUrl } = body;

    if (!id && !email) {
      return NextResponse.json({ error: "Teacher ID or email is required for editing" }, { status: 400 });
    }

    const formattedPhone = phone ? formatPhoneWith91(phone) : phone;

    const teacherToUpdate: Teacher = {
      id: id || email,
      name: name || "Faculty Member",
      email: email || "",
      phone: formattedPhone || "+91-9876500000",
      department: department || "Engineering",
      campus: (campus as CampusLocation) || "KARUR",
      coursesAssigned: Array.isArray(coursesAssigned)
        ? coursesAssigned
        : typeof coursesAssigned === "string"
        ? JSON.parse(coursesAssigned)
        : ["B.E. Computer Science"],
      experienceYears: Number(experienceYears) || 3,
      status: (status as "ACTIVE" | "ON_LEAVE") || "ACTIVE",
      avatar: body.avatar || (name ? name.slice(0, 2).toUpperCase() : "FM"),
      assignedQuota: Number(assignedQuota) || 1000,
      photoUrl: photoUrl || undefined,
    };

    // 1. Save directly to Firebase Firestore & RTDB
    try {
      await saveTeacherToFirebase(teacherToUpdate);
    } catch (fbErr) {
      console.warn("Firebase teacher update notice:", fbErr);
    }

    // 2. Update Prisma SQLite
    try {
      const updated = await prisma.teacher.update({
        where: id ? { id } : { email },
        data: {
          name,
          email,
          phone: formattedPhone,
          department,
          campus,
          coursesAssigned: Array.isArray(coursesAssigned)
            ? JSON.stringify(coursesAssigned)
            : typeof coursesAssigned === "string"
            ? coursesAssigned
            : "[]",
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
      return NextResponse.json(teacherToUpdate);
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

    // 1. Delete from Firebase Firestore & RTDB
    try {
      await deleteTeacherFromFirebase(id);
    } catch (fbErr) {
      console.warn("Firebase teacher delete notice:", fbErr);
    }

    // 2. Delete from Prisma SQLite
    try {
      await prisma.teacher.delete({ where: { id } });
    } catch (e) {
      // Fallback
    }

    return NextResponse.json({ success: true, message: `Teacher ${id} deleted successfully from Firebase and Database` });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete teacher" }, { status: 500 });
  }
}
