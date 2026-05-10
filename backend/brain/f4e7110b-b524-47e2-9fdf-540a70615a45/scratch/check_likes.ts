
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const carpets = await prisma.carpet.findMany({
    take: 10,
    orderBy: { likes: 'desc' },
    select: { id: true, name: true, likes: true },
  });

  console.log('Top 10 carpets by likes:');
  console.table(carpets);

  const totalLikesEntries = await prisma.carpetLike.count();
  console.log('Total entries in carpet_likes table:', totalLikesEntries);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
