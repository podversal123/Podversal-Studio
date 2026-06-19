import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const accounts = [
  { name: 'Shiva (Owner)',    email: 'admin@podversal.com',    password: 'Admin@12345',    role: Role.SUPER_ADMIN    },
  { name: 'Ravi (Manager)',   email: 'manager@podversal.com',  password: 'Manager@12345',  role: Role.STUDIO_MANAGER },
  { name: 'Kiran (Employee)', email: 'employee@podversal.com', password: 'Employee@12345', role: Role.EMPLOYEE        },
  { name: 'Amit (Agent)',     email: 'agent@podversal.com',    password: 'Agent@12345',    role: Role.REFERRAL_AGENT  },
  { name: 'Priya (Customer)', email: 'customer@podversal.com', password: 'Customer@12345', role: Role.CUSTOMER        },
];

async function main() {
  console.log('\nCreating accounts for all 5 roles...\n');

  for (const acc of accounts) {
    const exists = await prisma.user.findUnique({ where: { email: acc.email } });
    if (exists) {
      console.log(`⏭  Already exists: ${acc.email} (${acc.role})`);
      continue;
    }

    const hashed = await bcrypt.hash(acc.password, 10);
    const user   = await prisma.user.create({
      data: { name: acc.name, email: acc.email, password: hashed, role: acc.role },
    });

    // Create profile record for EMPLOYEE and REFERRAL_AGENT
    if (acc.role === Role.EMPLOYEE) {
      await prisma.employee.create({
        data: { userId: user.id, jobTitle: 'Camera Operator', shiftStart: '09:00', shiftEnd: '18:00' },
      });
    }
    if (acc.role === Role.REFERRAL_AGENT) {
      await prisma.agent.create({
        data: { userId: user.id, agencyName: 'Amit Agency', commissionRate: 10 },
      });
    }
    if (acc.role === Role.CUSTOMER) {
      await prisma.customer.create({
        data: { userId: user.id },
      });
    }

    console.log(`✅ Created: ${acc.email} | ${acc.role}`);
  }

  console.log('\n========================================');
  console.log('LOGIN CREDENTIALS FOR ALL ROLES:');
  console.log('========================================');
  accounts.forEach(a => {
    console.log(`${a.role.padEnd(20)} ${a.email.padEnd(30)} ${a.password}`);
  });
  console.log('========================================\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
