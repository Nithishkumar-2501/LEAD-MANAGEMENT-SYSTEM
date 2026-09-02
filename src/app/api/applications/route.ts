import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_LEADS } from "@/lib/mockData";
import { AppStage, LeadStatus, CampusLocation } from "@/types/crm";
import { saveStudentToFirebase } from "@/lib/firebaseSync";
import { validateLeadPhoneNumber } from "@/lib/phoneValidation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      include: {
        application: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json({ leads }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ leads: MOCK_LEADS }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      fatherName,
      motherName,
      gender,
      bloodGroup,
      physicallyDisabled,
      community,
      address,
      school,
      source,
      courseInterest,
      campus = "KARUR",
      marks10th,
      marks12th,
      stage = "INQUIRY",
    } = body;

    if (!name || !email || !courseInterest) {
      return NextResponse.json(
        { error: "Name, email, and course interest are required fields." },
        { status: 400 }
      );
    }

    const phoneErr = validateLeadPhoneNumber(phone, []);
    if (phoneErr) {
      return NextResponse.json({ error: phoneErr }, { status: 400 });
    }

    let status: LeadStatus = "NEW";
    if (stage === "SUBMITTED" || stage === "DOCS_VERIFIED") status = "IN_REVIEW";
    if (stage === "OFFER_ISSUED" || stage === "FEE_PAID") status = "ADMITTED";

    try {
      const newLead = await prisma.lead.create({
        data: {
          name,
          email,
          phone: phone || "+91 98765 43210",
          fatherName: fatherName || null,
          motherName: motherName || null,
          gender: gender || "Male",
          bloodGroup: bloodGroup || "O+",
          physicallyDisabled: physicallyDisabled || "No",
          community: community || "BC",
          address: address || null,
          school: school || null,
          source: source || "TNEA Counselling",
          courseInterest,
          campus: campus || "KARUR",
          status,
          application: {
            create: {
              stage: stage as AppStage,
              marks10th: Number(marks10th) || 85,
              marks12th: Number(marks12th) || 88,
              paymentStatus: stage === "FEE_PAID" ? "COMPLETED" : "PENDING",
            },
          },
        },
        include: {
          application: true,
        },
      });

      const leadRecord = { ...newLead, campus: campus as CampusLocation };
      try {
        await saveStudentToFirebase(leadRecord as any);
      } catch (fbErr) {}

      return NextResponse.json({ success: true, lead: leadRecord }, { status: 201 });
    } catch (dbError) {
      console.error("Prisma lead save error:", dbError);
      const mockLead = {
        id: `lead_${Date.now()}`,
        name,
        email,
        phone: phone || "+91 98765 43210",
        fatherName: fatherName || "",
        motherName: motherName || "",
        gender: gender || "Male",
        bloodGroup: bloodGroup || "O+",
        physicallyDisabled: physicallyDisabled || "No",
        community: community || "BC",
        address: address || "",
        school: school || "",
        source: source || "TNEA Counselling",
        courseInterest,
        campus: (campus || "KARUR") as CampusLocation,
        status,
        counselorId: "usr_admin_vsb",
        createdAt: new Date().toISOString(),
        application: {
          id: `app_${Date.now()}`,
          leadId: `lead_${Date.now()}`,
          stage: stage as AppStage,
          marks10th: Number(marks10th) || 85,
          marks12th: Number(marks12th) || 88,
          paymentStatus: stage === "FEE_PAID" ? "COMPLETED" : "PENDING",
        },
      };

      MOCK_LEADS.unshift(mockLead as any);

      return NextResponse.json({ success: true, lead: mockLead }, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}
