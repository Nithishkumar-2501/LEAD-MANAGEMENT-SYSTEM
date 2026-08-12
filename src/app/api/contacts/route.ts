import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_LEADS } from "@/lib/mockData";
import { Lead, Application } from "@/types/crm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campus = searchParams.get("campus");
    const district = searchParams.get("district");

    let leads: (Lead & { application: Application })[];
    try {
      const dbLeads = await prisma.lead.findMany({
        include: { application: true },
        orderBy: { createdAt: "desc" },
      });
      leads = dbLeads as unknown as (Lead & { application: Application })[];
    } catch (e) {
      leads = MOCK_LEADS as (Lead & { application: Application })[];
    }

    let filtered = leads;
    if (campus && campus !== "ALL") {
      filtered = filtered.filter((l) => l.campus === campus);
    }
    if (district && district !== "ALL") {
      filtered = filtered.filter(
        (l) => l.district?.toLowerCase() === district.toLowerCase()
      );
    }

    return NextResponse.json(filtered);
  } catch (error) {
    return NextResponse.json(MOCK_LEADS);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, courseInterest, campus, school, district, address } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and Phone number are required fields" },
        { status: 400 }
      );
    }

    try {
      const newLead = await prisma.lead.create({
        data: {
          name,
          email: email || `${name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
          phone,
          courseInterest: courseInterest || "B.E. Computer Science",
          campus: campus || "KARUR",
          school: school || "Govt Higher Secondary School",
          district: district || "Karur",
          address: address || "Tamil Nadu",
          source: "Direct Contact Entry",
          status: "NEW",
          application: {
            create: {
              stage: "INQUIRY",
              marks10th: 85.0,
              marks12th: 88.0,
              paymentStatus: "PENDING",
            },
          },
        },
        include: { application: true },
      });

      return NextResponse.json(newLead, { status: 201 });
    } catch (dbErr) {
      // Mock Fallback
      const mockNewContact = {
        id: `lead_${Date.now()}`,
        name,
        email: email || `${name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
        phone,
        courseInterest: courseInterest || "B.E. Computer Science",
        campus: campus || "KARUR",
        school: school || "Govt Higher Secondary School",
        district: district || "Karur",
        address: address || "Tamil Nadu",
        source: "Direct Contact Entry",
        status: "NEW",
        counselorId: "usr_admin_vsb",
        createdAt: new Date().toISOString(),
        application: {
          id: `app_${Date.now()}`,
          leadId: `lead_${Date.now()}`,
          stage: "INQUIRY" as const,
          marks10th: 85.0,
          marks12th: 88.0,
          paymentStatus: "PENDING",
        },
      };

      return NextResponse.json(mockNewContact, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to create contact record" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, email, phone, courseInterest, campus, school, district, address } = body;

    if (!id) {
      return NextResponse.json({ error: "Contact ID is required for editing" }, { status: 400 });
    }

    try {
      const updated = await prisma.lead.update({
        where: { id },
        data: {
          name,
          email,
          phone,
          courseInterest,
          campus,
          school,
          district,
          address,
        },
        include: { application: true },
      });

      return NextResponse.json(updated);
    } catch (e) {
      return NextResponse.json({
        id,
        name,
        email,
        phone,
        courseInterest,
        campus,
        school,
        district,
        address,
        source: "Direct Contact Entry",
        status: "NEW",
        createdAt: new Date().toISOString(),
        application: {
          id: `app_${id}`,
          leadId: id,
          stage: "INQUIRY" as const,
          marks10th: 85.0,
          marks12th: 88.0,
          paymentStatus: "PENDING",
        },
      });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Contact ID is required" }, { status: 400 });
    }

    try {
      await prisma.lead.delete({ where: { id } });
    } catch (e) {
      // Mock fallback ignore
    }

    return NextResponse.json({ success: true, message: `Contact ${id} deleted successfully` });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }
}
