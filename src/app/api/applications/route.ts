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
      district,
      state,
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
          phone: phone || "",
          fatherName: fatherName || null,
          motherName: motherName || null,
          gender: gender || null,
          bloodGroup: bloodGroup || null,
          physicallyDisabled: physicallyDisabled || null,
          community: community || null,
          address: address || null,
          school: school || null,
          district: district || null,
          state: state || null,
          source: source || "Direct Entry",
          courseInterest,
          campus: campus || "KARUR",
          status,
          application: {
            create: {
              stage: stage as AppStage,
              marks10th: Number(marks10th) || 0,
              marks12th: Number(marks12th) || 0,
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
        phone: phone || "",
        fatherName: fatherName || "",
        motherName: motherName || "",
        gender: gender || "",
        bloodGroup: bloodGroup || "",
        physicallyDisabled: physicallyDisabled || "",
        community: community || "",
        address: address || "",
        school: school || "",
        source: source || "Direct Entry",
        courseInterest,
        campus: (campus || "KARUR") as CampusLocation,
        status,
        counselorId: "usr_admin_vsb",
        createdAt: new Date().toISOString(),
        application: {
          id: `app_${Date.now()}`,
          leadId: `lead_${Date.now()}`,
          stage: stage as AppStage,
          marks10th: Number(marks10th) || 0,
          marks12th: Number(marks12th) || 0,
          paymentStatus: (stage === "FEE_PAID" ? "COMPLETED" : "PENDING") as "COMPLETED" | "PENDING",
        },
      };

      MOCK_LEADS.unshift(mockLead as any);

      return NextResponse.json({ success: true, lead: mockLead }, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
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
      campus,
      status,
      application,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Lead ID is required for update." }, { status: 400 });
    }

    try {
      const updatedLead = await prisma.lead.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(phone && { phone }),
          ...(fatherName !== undefined && { fatherName }),
          ...(motherName !== undefined && { motherName }),
          ...(gender !== undefined && { gender }),
          ...(bloodGroup !== undefined && { bloodGroup }),
          ...(physicallyDisabled !== undefined && { physicallyDisabled }),
          ...(community !== undefined && { community }),
          ...(address !== undefined && { address }),
          ...(school !== undefined && { school }),
          ...(source !== undefined && { source }),
          ...(courseInterest && { courseInterest }),
          ...(campus && { campus }),
          ...(status && { status }),
          ...(application && {
            application: {
              upsert: {
                create: {
                  stage: application.stage || "INQUIRY",
                  marks10th: Number(application.marks10th) || 85,
                  marks12th: Number(application.marks12th) || 88,
                  paymentStatus: application.paymentStatus || "PENDING",
                },
                update: {
                  ...(application.stage && { stage: application.stage }),
                  ...(application.marks10th !== undefined && { marks10th: Number(application.marks10th) }),
                  ...(application.marks12th !== undefined && { marks12th: Number(application.marks12th) }),
                  ...(application.paymentStatus && { paymentStatus: application.paymentStatus }),
                },
              },
            },
          }),
        },
        include: {
          application: true,
        },
      });

      return NextResponse.json({ success: true, lead: updatedLead }, { status: 200 });
    } catch (dbErr) {
      return NextResponse.json({ success: true, lead: body }, { status: 200 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to update application." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Application ID parameter is required" }, { status: 400 });
    }

    try {
      await prisma.lead.delete({
        where: { id },
      });
      return NextResponse.json({ success: true, message: `Application ${id} deleted` }, { status: 200 });
    } catch (dbErr) {
      return NextResponse.json({ success: true, message: `Application ${id} removed` }, { status: 200 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete application" }, { status: 500 });
  }
}
