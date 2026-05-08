
const fs = require('fs');
const path = require('path');

const filePath = 'd:/YEC_SOLD/backend/src/telegram/telegram.update.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Fix onStart duplication/corruption (already somewhat fixed but let's make sure)
// We already have lines 626 to 750 (approx) which seem to be the start of onStart.
// Let's re-read the file to be sure of current state.
console.log('Current length:', content.length);

// I'll use regex to find the problematic areas and fix them.

// Fix resolveCarpetPhoto signature and missing helpers
const onPhotoMarker = "await ctx.reply(`O'xshash gilamlar topildi. Eng yaxshi natijalar:`);";
const resolveMarker = "const frontUrl = process.env.FRONTEND_URL?.replace";

const helpers = `
      }

      for (const res of matchesToReturn) {
        const c = res.carpet;
        const photo = this.resolveCarpetPhoto(res.imgPath);
        const msg = \`<b>\${c.name}</b>\\nNarxi: \${Number(c.price).toLocaleString()} so'm\\nRazmer: \${c.size}\\nKodi: \${c.designCode || c.code || 'N/A'}\`;
        const inlineKeyboard = {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🛒 Saytda ko\\'rish', url: \`https://yecmarket.uz/carpets/\${c.id}\` }]
            ]
          }
        };

        if (photo) {
          await this.telegramService.sendPhoto(ctx.chat!.id.toString(), photo, msg, inlineKeyboard.reply_markup);
        } else {
          await ctx.reply(msg, { parse_mode: 'HTML', ...inlineKeyboard });
        }
      }
    } catch (e) {
      this.logger.error(\`Error in onPhoto: \${e.message}\`);
      await ctx.reply(\`Xatolik yuz berdi: \${e.message}\`);
    }
  }

  private async isSuperAdmin(ctx: Context): Promise<boolean> {
    const from = ctx.from;
    if (!from) return false;
    if (from.username === this.DEFAULT_ADMIN) return true;
    const user = await this.prisma.user.findUnique({
      where: { telegramChatId: from.id.toString() },
    });
    return user?.role === UserRole.SUPERADMIN;
  }

  private async isAdmin(ctx: Context): Promise<boolean> {
    const from = ctx.from;
    if (!from) return false;
    if (from.username === this.DEFAULT_ADMIN) return true;
    const user = await this.prisma.user.findUnique({
      where: { telegramChatId: from.id.toString() },
    });
    return user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERADMIN;
  }

  private async isSeller(ctx: Context): Promise<boolean> {
    const from = ctx.from;
    if (!from) return false;
    if (from.username === this.DEFAULT_ADMIN) return true;
    const user = await this.prisma.user.findUnique({
      where: { telegramChatId: from.id.toString() },
    });
    return (
      user?.role === UserRole.SELLER ||
      user?.role === UserRole.ADMIN ||
      user?.role === UserRole.SUPERADMIN
    );
  }

  private async isCourier(ctx: Context): Promise<boolean> {
    const from = ctx.from;
    if (!from) return false;
    const user = await this.prisma.user.findUnique({
      where: { telegramChatId: from.id.toString() },
    });
    return user?.role === UserRole.COURIER;
  }

  private resolveCarpetPhoto(
    image: string,
  ): string | { source: string } | null {
    if (!image) return null;
    const trimmed = image.trim();
    if (!trimmed) return null;

    if (/^https?:\\/\\//i.test(trimmed)) {
      return trimmed;
    }

    const normalized = trimmed.replace(/\\\\/g, '/');
    const withoutLeading = normalized.replace(/^\\/+/, '');

    if (withoutLeading.startsWith('images/')) {
      const local = this.resolveFrontPublicAsset(withoutLeading);
      if (local) return { source: local };
`;

const searchString = onPhotoMarker + "\\s*" + resolveMarker;
// We need to insert helpers between them.
// But the previous edit deleted lines, so let's find the gap.

const parts = content.split(onPhotoMarker);
if (parts.length === 2) {
    const secondPart = parts[1];
    const resolvePart = secondPart.indexOf(resolveMarker);
    if (resolvePart !== -1) {
        content = parts[0] + onPhotoMarker + helpers + secondPart.substring(resolvePart);
        console.log('Fixed onPhoto and added helpers.');
    } else {
        console.log('Could not find resolveMarker in second part.');
    }
} else {
    console.log('Could not find onPhotoMarker or found multiple.');
}

fs.writeFileSync(filePath, content);
console.log('Done.');
