const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
  const cats = await prisma.category.findMany({ where: { name: { contains: 'iran', mode: 'insensitive' } } });
  
  const carpets = await prisma.carpet.findMany({
    where: {
      OR: [
        { name: { contains: 'iran', mode: 'insensitive' } },
        { category: { name: { contains: 'iran', mode: 'insensitive' } } },
        { description: { contains: 'iran', mode: 'insensitive' } }
      ]
    },
    include: { category: true }
  });
  
  const greenCarpets = carpets.filter(c => 
    c.name.toLowerCase().includes('yashil') || 
    c.name.toLowerCase().includes('green') || 
    c.name.toLowerCase().includes('зелен') || 
    (c.description && c.description.toLowerCase().includes('yashil'))
  );
  
  let res = "";
  if (greenCarpets.length > 0) {
    res = JSON.stringify(greenCarpets.slice(0, 5).map(c => ({ id: c.id, name: c.name, img: c.images })), null, 2);
  } else {
    for (let i=0; i<Math.min(10, carpets.length); i++) {
        res += carpets[i].name + " " + JSON.stringify(carpets[i].images) + "\n";
    }
  }
  fs.writeFileSync('result.txt', res);
}

main().catch(err => {
    fs.writeFileSync('err.log', err.toString() + "\n" + err.stack);
}).finally(() => prisma.$disconnect());
