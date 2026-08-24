import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_LEADS, MOCK_TEACHERS } from "@/lib/mockData";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    console.log("🌱 Triggering Database Seeder...");

    // Seed Leads and Applications
    let seededLeadsCount = 0;
    for (const leadData of MOCK_LEADS) {
      const existing = await prisma.lead.findFirst({
        where: { email: leadData.email },
      });

      if (!existing) {
        await prisma.lead.create({
          data: {
            id: leadData.id,
            name: leadData.name,
            email: leadData.email,
            phone: leadData.phone,
            source: leadData.source || "TNEA Counselling",
            courseInterest: leadData.courseInterest,
            campus: leadData.campus || "KARUR",
            school: leadData.school || "Govt Higher Secondary School",
            district: leadData.district || "Karur",
            address: leadData.address || "Tamil Nadu",
            status: (leadData.status as any) || "NEW",
            application: {
              create: {
                stage: (leadData.application?.stage as any) || "INQUIRY",
                marks10th: leadData.application?.marks10th || 85.0,
                marks12th: leadData.application?.marks12th || 88.0,
                paymentStatus: leadData.application?.paymentStatus || "PENDING",
              },
            },
          },
        });
        seededLeadsCount++;
      }
    }

    // Seed Faculty Members
    let seededTeachersCount = 0;
    for (const teacher of MOCK_TEACHERS) {
      const existingTeacher = await prisma.teacher.findFirst({
        where: { email: teacher.email },
      });

      if (!existingTeacher) {
        await prisma.teacher.create({
          data: {
            id: teacher.id,
            name: teacher.name,
            email: teacher.email,
            phone: teacher.phone,
            department: teacher.department,
            campus: teacher.campus || "KARUR",
            coursesAssigned: teacher.coursesAssigned || [],
            experienceYears: teacher.experienceYears || 5,
            status: teacher.status || "ACTIVE",
            avatar: teacher.avatar || "VS",
            assignedQuota: teacher.assignedQuota || 100,
            contactedCount: teacher.contactedCount || 0,
          },
        });
        seededTeachersCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database Seeder Executed Successfully!",
      seededLeadsCount,
      seededTeachersCount,
      totalDatabaseLeads: MOCK_LEADS.length,
      totalDatabaseTeachers: MOCK_TEACHERS.length,
    });
  } catch (error: any) {
    console.error("Database Seeder Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to execute database seeder",
        fallbackMode: "Active (Local State Persistent Database Sync)",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
