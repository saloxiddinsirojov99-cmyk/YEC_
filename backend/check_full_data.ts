import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const joynamoz = await prisma.carpet.findMany({
    where: { category: { name: { contains: 'joynamoz', mode: 'insensitive' } } },
    include: { category: true }
  });
  console.log('Joynamoz count:', joynamoz.length);
  console.log('Joynamoz sample:', joynamoz.slice(0, 3).map(c => ({
    name: c.name,
    size: c.size,
    price: c.price,
    images: c.images,
    desc: c.description
  })));
  
  const cats = await prisma.category.findMany();
  console.log('Categories:', cats.map(c => ({ id: c.id, name: c.name, image: c.image })));
}
main().finally(() => prisma.$disconnect());
