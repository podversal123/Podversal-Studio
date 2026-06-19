import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email    = process.env.ADMIN_EMAIL    ?? 'admin@podversal.com';
  const password = process.env.ADMIN_PASSWORD ?? 'Admin@12345';
  const name     = process.env.ADMIN_NAME     ?? 'Studio Owner';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: Role.SUPER_ADMIN },
  });

  console.log(`✅ SUPER_ADMIN created:`);
  console.log(`   Email    : ${email}`);
  console.log(`   Password : ${password}`);
  console.log(`   ID       : ${user.id}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
