import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const cats = await prisma.category.findMany();
  console.log('Categories:', cats);
  const joynamoz = await prisma.carpet.findMany({
    where: { category: { name: { contains: 'joynamoz', mode: 'insensitive' } } },
    include: { category: true }
  });
  console.log('Joynamoz samples:', joynamoz.slice(0, 3));
}
main().finally(() => prisma.$disconnect());
