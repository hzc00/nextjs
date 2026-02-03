import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed script...");
  const adminEmail = "admin@admin.com";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("123456", 10);

    const admin = await prisma.user.create({
      data: {
        name: "Super Admin",
        email: adminEmail,
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });

    console.log(`Created admin user: ${admin.name} (${admin.email})`);
  } else {
    console.log(`Admin user already exists: ${existingAdmin.email}`);
  }

  const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminUser) return;

  // --- Seed Investment Data ---
  console.log("Seeding Investment Data...");

  const positions = [
    {
      code: "00700",
      name: "腾讯控股",
      type: "STOCK",
      currentPrice: 385.2,
      avgCost: 350.0,
      quantity: 1000,
    },
    {
      code: "000001",
      name: "上证指数ETF",
      type: "FUND",
      currentPrice: 1.25,
      avgCost: 1.20,
      quantity: 50000,
    },
    {
      code: "TSLA",
      name: "Tesla Inc",
      type: "STOCK",
      currentPrice: 240.5,
      avgCost: 260.0,
      quantity: 50,
    }
  ];

  for (const pos of positions) {
    const existingAsset = await prisma.asset.findUnique({
      where: { code: pos.code }
    });

    if (!existingAsset) {
      await prisma.asset.create({
        data: {
          code: pos.code,
          name: pos.name,
          type: pos.type as any,
          currentPrice: pos.currentPrice,
          avgCost: pos.avgCost,
          quantity: pos.quantity,
          userId: adminUser.id, // Assign to Admin
          // Create an initial BUY transaction to justify holdings
          transactions: {
            create: {
              type: "BUY",
              price: pos.avgCost,
              quantity: pos.quantity,
              totalAmount: pos.avgCost * pos.quantity,
              date: new Date(),
              notes: "Initial Seed",
            }
          }
        }
      });
      console.log(`Created asset: ${pos.name}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
