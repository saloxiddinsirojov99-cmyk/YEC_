
const { PrismaClient } = require('@prisma/client');
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
  
  const topLikedInTable = await prisma.carpetLike.groupBy({
    by: ['carpetId'],
    _count: {
      carpetId: true
    },
    orderBy: {
      _count: {
        carpetId: 'desc'
      }
    },
    take: 10
  });
  
  console.log('Top 10 carpets by actual entries in carpet_likes:');
  console.table(topLikedInTable);
}

main().catch(console.error).finally(() => prisma.$disconnect());
