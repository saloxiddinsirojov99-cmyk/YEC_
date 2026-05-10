import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.carpet.count();
  console.log('Total carpets:', count);
  const samples = await prisma.carpet.findMany({ take: 5, select: { id: true, name: true, size: true } });
  console.log('Sample carpets:', samples);
  
  const categories = await prisma.category.count();
  console.log('Total categories:', categories);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
