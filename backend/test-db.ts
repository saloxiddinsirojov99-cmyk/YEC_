import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing category and carpet query...');
    const categories = await prisma.category.findMany({
      where: { name: { contains: 'Joynamoz', mode: 'insensitive' } },
    });
    console.log('Categories:', categories);

    if (categories.length > 0) {
      const carpets = await prisma.carpet.findMany({
        where: { categoryId: { in: categories.map(c => c.id) } },
        orderBy: { createdAt: 'desc' },
      });
      console.log('Carpets in these categories:', carpets);
    }
  } catch (err: any) {
    console.error('Query failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
