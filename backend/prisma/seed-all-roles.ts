import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Only system-level accounts  no test dummy data
const accounts = [
  {
    name: "Studio Owner",
    email: "admin@podversal.com",
    password: "Admin@12345",
    role: Role.SUPER_ADMIN,
  },
  {
    name: "Studio Manager",
    email: "manager@podversal.com",
    password: "Manager@12345",
    role: Role.STUDIO_MANAGER,
  },
];

async function main() {
  console.log("\nSeeding system accounts...\n");

  for (const acc of accounts) {
    const exists = await prisma.user.findUnique({
      where: { email: acc.email },
    });
    if (exists) {
      console.log(`⏭  Already exists: ${acc.email} (${acc.role})`);
      continue;
    }

    const hashed = await bcrypt.hash(acc.password, 10);
    await prisma.user.create({
      data: {
        name: acc.name,
        email: acc.email,
        password: hashed,
        role: acc.role,
      },
    });

    console.log(`✅ Created: ${acc.email} | ${acc.role}`);
  }

  console.log("\nDone.\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
