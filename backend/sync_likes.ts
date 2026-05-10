
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Syncing likes...');
  const carpets = await prisma.carpet.findMany({ select: { id: true } });
  
  for (const carpet of carpets) {
    const count = await prisma.carpetLike.count({ where: { carpetId: carpet.id } });
    await prisma.carpet.update({
      where: { id: carpet.id },
      data: { likes: count }
    });
  }
  
  console.log('Likes synced successfully.');
  
  const top = await prisma.carpet.findMany({
    orderBy: { likes: 'desc' },
    take: 5,
    select: { name: true, likes: true }
  });
  console.table(top);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
