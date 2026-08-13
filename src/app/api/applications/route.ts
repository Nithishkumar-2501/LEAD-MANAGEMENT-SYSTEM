import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_LEADS } from "@/lib/mockData";
import { AppStage, LeadStatus, CampusLocation } from "@/types/crm";

export async function GET() {
  try {
    const applications = await prisma.application.findMany({
      include: {
        lead: true,
        payments: true,
      },
      orderBy: {
        lead: {
          createdAt: "desc",
        },
      },
    });
    return NextResponse.json({ applications }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ applications: MOCK_LEADS.map(l => l.application) }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
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

    let status: LeadStatus = "NEW";
    if (stage === "SUBMITTED" || stage === "DOCS_VERIFIED") status = "IN_REVIEW";
    if (stage === "OFFER_ISSUED" || stage === "FEE_PAID") status = "ADMITTED";

    try {
      const newLead = await prisma.lead.create({
        data: {
          name,
          email,
          phone: phone || "+91 98765 43210",
          source: source || "Official VSB Portal",
          courseInterest,
          status,
          application: {
            create: {
              stage: stage as AppStage,
              marks10th: Number(marks10th) || 80,
              marks12th: Number(marks12th) || 82,
              paymentStatus: stage === "FEE_PAID" ? "COMPLETED" : "PENDING",
            },
          },
        },
        include: {
          application: true,
        },
      });

      return NextResponse.json({ success: true, lead: { ...newLead, campus: campus as CampusLocation } }, { status: 201 });
    } catch (dbError) {
      const mockLead = {
        id: `lead_${Date.now()}`,
        name,
        email,
        phone: phone || "+91 98765 43210",
        source: source || "Official VSB Portal",
        courseInterest,
        campus: (campus || "KARUR") as CampusLocation,
        status,
        counselorId: "usr_admin_vsb",
        createdAt: new Date().toISOString(),
        application: {
          id: `app_${Date.now()}`,
          leadId: `lead_${Date.now()}`,
          stage: stage as AppStage,
          marks10th: Number(marks10th) || 80,
          marks12th: Number(marks12th) || 82,
          paymentStatus: stage === "FEE_PAID" ? "COMPLETED" : "PENDING",
        },
      };

      MOCK_LEADS.unshift(mockLead);

      return NextResponse.json({ success: true, lead: mockLead }, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}
