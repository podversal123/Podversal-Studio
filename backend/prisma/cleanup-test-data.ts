import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_EMAILS = [
  'employee@podversal.com',
  'agent@podversal.com',
  'customer@podversal.com',
];

async function main() {
  console.log('\nRemoving test dummy accounts...\n');

  for (const email of TEST_EMAILS) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`⏭  Not found: ${email}`);
      continue;
    }

    // Delete profile records first (FK constraints)
    await prisma.employee.deleteMany({ where: { userId: user.id } });
    await prisma.agent.deleteMany(   { where: { userId: user.id } });
    await prisma.customer.deleteMany({ where: { userId: user.id } });

    // Delete the user
    await prisma.user.delete({ where: { id: user.id } });
    console.log(`🗑  Deleted: ${email}`);
  }

  console.log('\nCleanup complete. Tables will now show only real registered users.\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
