const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PRICE_MAP = {
  'iran-soft': 370000,
  'eron-soft': 370000,
  'iran': 370000,
  'eron': 370000,
  'soft': 370000,
  'touch': 198700,
  'luna': 180000, // Example fallback if any, user didn't specify all
  'trio': 180000,
  'fendi': 250000,
  'steffano': 250000
};

const DESCRIPTIONS = [
  "Ushbu gilam xonadonigizga haqiqiy shohona ko'rk bag'ishlaydi. Yumshoq yuzasi va mustahkam to'qilishi bilan ajralib turadi.",
  "Zamonaviy interyerlar uchun ideal tanlov. Chiroyli naqshlari bilan ko'zni quvnatadi va uzoq yillar xizmat qiladi.",
  "Premium klass gilami. Materiali ekologik toza va tozalashga juda qulay. Har qanday xonaga o'zgacha fayz kiritadi.",
  "Yuqori sifatli xomashyodan tayyorlangan ushbu gilam o'zining yorqin ranglari va jozibador dizayni bilan ajralib turadi.",
  "Nafis did egalari uchun maxsus kolleksiya. Uyingizdagi shinamlik va issiqlikni ta'minlash uchun mukammal yechim.",
  "Klassik va zamonaviy uyg'unlikni o'zida jamlagan ushbu model, chidamliligi va yumshoqligi bilan barchaga manzur bo'ladi.",
  "Elegant dizayn va yuqori zichlikdagi to'qima. Oila a'zolarigiz uchun eng qulay va xavfsiz tanlov.",
  "Yorqin ranglar va noyob naqshlar. Bu gilam mehmonxonangizning eng asosiy bezagiga aylanishi shubhasiz.",
  "Sifat va ishonch - bu gilamning asosiy xususiyatlari. Antibakterial va anti-allergik hususiyatlarga ega.",
  "Haqiqiy qulaylikni his eting. O'ta mustahkam iplar yordamida to'qilgan bo'lib, ranglari o'chmaydi va ko'chmaydi."
];

function getRandomDescription() {
  return DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)];
}

async function updateCarpets() {
  console.log('Fetching carpets...');
  const carpets = await prisma.carpet.findMany({ include: { category: true } });
  
  let updatedCount = 0;

  for (const carpet of carpets) {
    let newPrice = undefined;
    const nameLower = carpet.name.toLowerCase();
    
    // Determine price based on name keywords
    for (const [key, price] of Object.entries(PRICE_MAP)) {
      if (nameLower.includes(key)) {
        newPrice = price;
        break;
      }
    }

    // Always update description except for Joynamoz? User said "barcha gilamlarni update qilib chiq"
    const isPrayerMat = carpet.category && carpet.category.name.toLowerCase().includes('joynamoz');
    const newDescription = isPrayerMat ? 
      "Yuqori sifatli va chiroyli dizaynga ega joynamoz. Ibodat uchun qulay va yoqimli." : 
      getRandomDescription();

    const dataToUpdate = { description: newDescription };
    if (newPrice) {
      dataToUpdate.price = newPrice;
    }

    try {
      await prisma.carpet.update({
        where: { id: carpet.id },
        data: dataToUpdate
      });
      updatedCount++;
    } catch (err) {
      console.error(`Failed to update carpet ${carpet.id}:`, err);
    }
  }

  console.log(`Successfully updated ${updatedCount} carpets out of ${carpets.length}.`);
}

updateCarpets()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
