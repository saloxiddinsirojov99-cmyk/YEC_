import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        telegramUsername: true,
        telegramChatId: true,
      },
    });
    console.log('USERS_START');
    console.log(JSON.stringify(users, null, 2));
    console.log('USERS_END');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
