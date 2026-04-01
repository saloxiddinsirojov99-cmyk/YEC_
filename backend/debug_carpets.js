
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const prayerCarpets = await prisma.carpet.findMany({
    where: {
      category: {
        name: { contains: 'joynamoz', mode: 'insensitive' }
      }
    },
    take: 5,
    include: { category: true }
  });

  const ovalCarpets = await prisma.carpet.findMany({
    where: {
      category: {
        name: { contains: 'oval', mode: 'insensitive' }
      }
    },
    take: 5,
    include: { category: true }
  });

  console.log('--- PRAYER CARPETS ---');
  console.log(JSON.stringify(prayerCarpets, null, 2));
  console.log('--- OVAL CARPETS ---');
  console.log(JSON.stringify(ovalCarpets, null, 2));

  const totalPrayer = await prisma.carpet.count({
    where: {
      category: {
        name: { contains: 'joynamoz', mode: 'insensitive' }
      }
    }
  });

  const totalOval = await prisma.carpet.count({
    where: {
      category: {
        name: { contains: 'oval', mode: 'insensitive' }
      }
    }
  });

  console.log(`Total Prayer: ${totalPrayer}`);
  console.log(`Total Oval: ${totalOval}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
