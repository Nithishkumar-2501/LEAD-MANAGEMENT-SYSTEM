import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Database Seeding...");

  // 1. Create Counselor User
  const counselor = await prisma.user.upsert({
    where: { email: "sarah.jenkins@university.edu" },
    update: {},
    create: {
      name: "Sarah Jenkins",
      email: "sarah.jenkins@university.edu",
      role: "COUNSELOR",
    },
  });

  console.log(`✅ Counselor Created: ${counselor.name}`);

  // 2. Create Initial Leads
  const leadsCount = await prisma.lead.count();
  if (leadsCount === 0) {
    await prisma.lead.create({
      data: {
        name: "S. Kausalya",
        email: "kausalya.tnea2026@gmail.com",
        phone: "+91 94421 88990",
        source: "TNEA Counselling",
        courseInterest: "B.E. Computer Science and Engineering",
        campus: "KARUR",
        status: "NEW",
        counselorId: counselor.id,
        application: {
          create: {
            stage: "INQUIRY",
            marks10th: 92.5,
            marks12th: 94.8,
            paymentStatus: "PENDING",
          },
        },
      },
    });
  }

  console.log("🎉 Database Seeding Finished Successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
