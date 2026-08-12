import { PrismaClient, Role, LeadStatus, AppStage, TaskType } from "@prisma/client";

const prisma = new PrismaClient();

interface SeedLeadItem {
  name: string;
  email: string;
  phone: string;
  source: string;
  courseInterest: string;
  status: LeadStatus;
  appStage: AppStage;
  marks10th: number;
  marks12th: number;
  paymentStatus: string;
  paymentAmount?: number;
  txnId?: string;
}

async function main() {
  console.log("🌱 Starting Database Seeding...");

  // 1. Create Counselor User
  const counselor = await prisma.user.upsert({
    where: { email: "sarah.jenkins@university.edu" },
    update: {},
    create: {
      name: "Sarah Jenkins",
      email: "sarah.jenkins@university.edu",
      role: Role.COUNSELOR,
    },
  });

  console.log(`✅ Counselor Created: ${counselor.name}`);

  // 2. Create Leads & Applications
  const leadsData: SeedLeadItem[] = [
    {
      name: "Alex Rivera",
      email: "alex.rivera@gmail.com",
      phone: "+1 (555) 234-5678",
      source: "Google Search",
      courseInterest: "B.Tech Computer Science",
      status: LeadStatus.ADMITTED,
      appStage: AppStage.FEE_PAID,
      marks10th: 92.5,
      marks12th: 94.8,
      paymentStatus: "COMPLETED",
      paymentAmount: 4500,
      txnId: "TXN_998827361",
    },
    {
      name: "Sophia Zhang",
      email: "sophia.zhang@outlook.com",
      phone: "+1 (555) 876-5432",
      source: "Education Fair",
      courseInterest: "B.Sc Data Science",
      status: LeadStatus.IN_REVIEW,
      appStage: AppStage.DOCS_VERIFIED,
      marks10th: 88.0,
      marks12th: 91.2,
      paymentStatus: "PENDING",
    },
    {
      name: "Marcus Vance",
      email: "m.vance@yahoo.com",
      phone: "+1 (555) 345-6789",
      source: "Instagram Campaign",
      courseInterest: "BBA International Business",
      status: LeadStatus.CONTACTED,
      appStage: AppStage.SUBMITTED,
      marks10th: 81.4,
      marks12th: 84.0,
      paymentStatus: "PENDING",
    },
    {
      name: "Emily Watson",
      email: "emily.w@techmail.io",
      phone: "+1 (555) 987-6543",
      source: "Direct Website",
      courseInterest: "B.Tech Artificial Intelligence",
      status: LeadStatus.ADMITTED,
      appStage: AppStage.OFFER_ISSUED,
      marks10th: 95.0,
      marks12th: 96.5,
      paymentStatus: "PENDING",
    },
    {
      name: "Aaliyah Patel",
      email: "aaliyah.p@outlook.com",
      phone: "+1 (555) 789-0123",
      source: "Google Search",
      courseInterest: "B.Sc Cyber Security",
      status: LeadStatus.ADMITTED,
      appStage: AppStage.FEE_PAID,
      marks10th: 94.1,
      marks12th: 93.8,
      paymentStatus: "COMPLETED",
      paymentAmount: 5200,
      txnId: "TXN_998827362",
    },
  ];

  for (const item of leadsData) {
    const lead = await prisma.lead.create({
      data: {
        name: item.name,
        email: item.email,
        phone: item.phone,
        source: item.source,
        courseInterest: item.courseInterest,
        status: item.status,
        counselorId: counselor.id,
        application: {
          create: {
            stage: item.appStage,
            marks10th: item.marks10th,
            marks12th: item.marks12th,
            paymentStatus: item.paymentStatus,
          },
        },
      },
      include: { application: true },
    });

    if (item.paymentAmount && item.txnId && lead.application) {
      await prisma.payment.create({
        data: {
          applicationId: lead.application.id,
          amount: item.paymentAmount,
          status: "COMPLETED",
          transactionId: item.txnId,
        },
      });
    }

    // Add tasks
    await prisma.task.create({
      data: {
        counselorId: counselor.id,
        leadId: lead.id,
        title: `Follow up on ${item.courseInterest} enrollment for ${item.name}`,
        type: item.status === LeadStatus.NEW ? TaskType.CALL : TaskType.EMAIL,
        dueDate: new Date(),
        isCompleted: false,
      },
    });
  }

  console.log("🎉 Database Seeding Finished Successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
