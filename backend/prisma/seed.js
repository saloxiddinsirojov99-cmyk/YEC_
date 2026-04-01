require('dotenv').config();

const { PrismaClient, UserRole } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL topilmadi. .env faylini tekshiring.');
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@yecmarket.uz';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log(`Admin allaqachon mavjud: ${adminEmail}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.create({
    data: {
      name: 'System Admin',
      email: adminEmail,
      phone: '+998900000000',
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  });

  console.log(`Admin yaratildi: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
