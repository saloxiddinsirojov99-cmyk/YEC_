import { Update, Start, On, Command, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { UserRole } from '@prisma/client';
import { TelegramService } from './telegram.service';
import { formatOrderNumber } from '../common/utils/order-number';

type CollectionCodeEntry = {
  slug: string;
  path: string;
};

@Update()
export class TelegramUpdate {
  private readonly logger = new Logger(TelegramUpdate.name);
  private readonly DEFAULT_ADMIN = 'Saloxiddin_977';
  private readonly MENU_MAIN_SEARCH = '🔍 Gilam qidirish';
  private readonly MENU_MAIN_NEW_ORDERS = '📦 Yangi buyurtmalar';
  private readonly MENU_MAIN_ADD_ADMIN = "👤 Admin qo'shish";
  private readonly MENU_SEARCH_IMAGE = '🖼 Rasm bilan qidirish';
  private readonly MENU_SEARCH_NAME = '📝 Nom bilan';
  private readonly MENU_SEARCH_CODE = '🔢 Gul kodi bilan qidirish';
  private readonly MENU_BACK = '⬅️ Orqaga';
  private collectionCodeMap: Map<string, CollectionCodeEntry[]> | null = null;
  private collectionNameToSlug: Map<string, string> | null = null;
  private frontPublicDir: string | null = null;

  // In-memory pending admin requests: chatId -> { username, firstName }
  private readonly pendingRequests = new Map<
    string,
    { username: string; firstName: string }
  >();
  // Pre-approved by admins (chatId -> true), waiting for website registration
  private readonly preApprovedChatIds = new Set<string>();
  // Rejected by admins
  private readonly rejectedChatIds = new Set<string>();
  // Chats waiting for carpet search query
  private readonly carpetSearchState = new Set<string>();
  private readonly searchNameState = new Set<string>();
  private readonly searchCodeState = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
  ) {}

  private buildMainKeyboard() {
    return {
      reply_markup: {
        keyboard: [
          [
            { text: '🔍 Mahsulot qidirish' },
            { text: '📦 Buyurtmalar' },
          ],
          [
            { text: '👤 Adminlar' },
          ],
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
        input_field_placeholder: "Qidirish uchun nomini kiriting...",
      },
    };
  }

  private buildSearchKeyboard() {
    return {
      reply_markup: {
        keyboard: [
          [
            { text: this.MENU_SEARCH_IMAGE },
            { text: this.MENU_SEARCH_NAME },
          ],
          [{ text: this.MENU_SEARCH_CODE }],
          [{ text: this.MENU_BACK }],
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
        is_persistent: true,
        input_field_placeholder: "Qidiruv turini tanlang",
      },
    };
  }

  private clearSearchState(chatId: string) {
    this.searchNameState.delete(chatId);
    this.searchCodeState.delete(chatId);
  }

  private async showMainMenu(ctx: Context, message?: string) {
    await ctx.reply(
      message ?? "Asosiy menyu. Pastdagi tugmalardan foydalaning.",
      this.buildMainKeyboard(),
    );
  }

  private async showSearchMenu(ctx: Context) {
    await ctx.reply(
      "🔍 Qanday qidiruvni amalga oshirmoqchisiz? Pastdagi tugmalardan birini tanlang:",
      this.buildSearchKeyboard(),
    );
  }

  private async handleInviteLink(ctx: Context) {
    const adminSecret =
      process.env.ADMIN_INVITE_SECRET || 'yec_toshkent_admin_secret_2024';
    const botUsername = ctx.botInfo.username;
    const inviteLink = `https://t.me/${botUsername}?start=admin_join_${adminSecret}`;
    await ctx.reply(
      `👤 Yangi admin qo'shish uchun linkni bosing yoki ulashing:\n\n<a href="${inviteLink}">Admin bo'lish uchun botni ochish</a>\n\n‼️ Faqat ishonchli odamlarga yuboring!`,
      { parse_mode: 'HTML', ...this.buildMainKeyboard() },
    );
  }

  private async handleNewOrders(ctx: Context) {
    const orders = await this.prisma.order.findMany({
      include: {
        items: {
          include: { carpet: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
    if (orders.length === 0) {
      await ctx.reply("📋 Hozircha hech qanday buyurtma yo'q.", this.buildMainKeyboard());
      return;
    }

    const msgs = orders.map((order) => {
      const itemsText = order.items
        .map((i) => `- ${i.carpet?.name ?? "Noma'lum gilam"} x${i.quantity}`)
        .join('\n');
      
      let statusIcon = '⏳';
      if (order.status === 'ACCEPTED') statusIcon = '✅';
      if (order.status === 'ON_WAY') statusIcon = '🚚';
      if (order.status === 'DELIVERED') statusIcon = '🎉';
      if (order.status === 'CANCELLED') statusIcon = '❌';

      return `📦 <b>Buyurtma #${formatOrderNumber(order.id, order.createdAt)}</b>\n` +
             `👤 Mijoz: ${order.customerName}\n` +
             `📞 Tel: ${(order as any).phone || 'Noma\'lum'}\n` +
             `📍 Manzil: ${order.address}\n` +
             `${statusIcon} Holati: ${order.status}\n\n` +
             `📝 Mahsulotlar:\n${itemsText}`;
    });

    for (const msg of msgs) {
      await ctx.reply(msg, { parse_mode: 'HTML', ...this.buildMainKeyboard() });
    }
  }

  @Start()
  async onStart(@Ctx() ctx: Context) {
    const chatId = ctx.chat!.id.toString();
    const username = ctx.from?.username || '';
    const firstName = ctx.from?.first_name || '';

    const text = (ctx as any).message?.text || '';
    if (text.startsWith('/start admin_join_')) {
      const secret = text.replace('/start admin_join_', '');
      const expectedSecret =
        process.env.ADMIN_INVITE_SECRET || 'yec_toshkent_admin_secret_2024';

      if (secret !== expectedSecret) {
        await ctx.reply("❌ Yaroqsiz yoki eskirgan taklif havolasi.");
        return;
      }
      if (this.pendingRequests.has(chatId)) {
        await ctx.reply(
          "⏳ Sizning so'rovingiz allaqachon yuborilgan. Adminlar ko'rib chiqmoqda, iltimos kuting.",
        );
        return;
      }

      // C. Already pre-approved -> they need to register on the website
      if (this.preApprovedChatIds.has(chatId)) {
        await ctx.reply(
          "✅ Adminlar sizni tasdiqlagan! Agar hali ro'yxatdan o'tmagan bo'lsangiz, yecmarket.uz saytida ro'yxatdan o'ting va /start deb yozing.",
        );
        return;
      }

      // D. Check if in DB -> promote immediately
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { telegramChatId: chatId },
            {
              telegramUsername:
                username && username !== '' ? username : undefined,
            },
          ],
        },
      });

      if (existingUser) {
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: UserRole.ADMIN,
            telegramChatId: chatId,
            telegramUsername: username,
          },
        });
        await ctx.reply(
          `✅ Tabriklaymiz, <b>${existingUser.name}</b>! Siz endi <b>Admin</b> sifatida tayinlandingiz.`,
          { parse_mode: 'HTML' },
        );
        return;
      }

      // E. Not in DB -> save as pending and notify all admins
      this.pendingRequests.set(chatId, { username, firstName });
      await ctx.reply(
        `⏳ Salom, <b>${firstName}</b>! Sizning admin bo'lish so'rovingiz adminlarga yuborildi. Ular tasdiqlasa, siz ham admin bo'lasiz.\n\nAgar hali saytda ro'yxatdan o'tmagan bo'lsangiz, <b>yecmarket.uz</b> saytida ro'yxatdan o'ting.`,
        { parse_mode: 'HTML' },
      );

      // Notify all admins
      const admins = await this.prisma.user.findMany({
        where: {
          role: { in: [UserRole.ADMIN, UserRole.SUPERADMIN] },
          telegramChatId: { not: null },
        },
      });

      const noticeText = `👤 <b>Yangi admin so'rovi!</b>\n\nIsm: <b>${firstName}</b>\nUsername: ${username ? `@${username}` : "yo'q"}\nTelegram ID: <code>${chatId}</code>\n\nUshbu odamni admin qilishni xohlaysizmi?`;
      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '✅ Tasdiqlash',
                callback_data: `approve_admin_${chatId}`,
              },
              { text: '❌ Rad etish', callback_data: `reject_admin_${chatId}` },
            ],
          ],
        },
        parse_mode: 'HTML' as const,
      };

      for (const admin of admins) {
        if (admin.telegramChatId) {
          try {
            await this.telegramService.sendRaw(
              admin.telegramChatId,
              noticeText,
              keyboard.reply_markup,
            );
          } catch (e) {
            this.logger.error(
              `Admin ${admin.telegramChatId} ga xabar yuborishda xatolik: ${e.message}`,
            );
          }
        }
      }
      return;
    }

    // 1. Check if user exists by telegramChatId or telegramUsername
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { telegramChatId: chatId },
          {
            telegramUsername:
              username && username !== '' ? username : undefined,
          },
        ],
      },
    });

    const adminKeyboard = this.buildMainKeyboard();

    // 2. Handle Default Admin linking
    if (username === this.DEFAULT_ADMIN) {
      if (!user) {
        user = await this.prisma.user.findFirst({
          where: {
            OR: [
              { name: { contains: 'Saloxiddin', mode: 'insensitive' } },
              { email: 'saloxiddinsirojov99@gmail.com' },
            ],
          },
        });
      }

      if (user) {
        const isAlreadyLinked = user.telegramChatId === chatId;
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            telegramChatId: chatId,
            telegramUsername: username,
            role: UserRole.SUPERADMIN,
          },
        });

        const msg = isAlreadyLinked
          ? `👋 Xush kelibsiz, <b>Super Admin</b> janoblari!\n\nNimani qilmoqchisiz?`
          : `✅ Xush kelibsiz, Super Admin <b>@${username}</b>! Telegram hisobingiz muvaffaqiyatli bog'landi.`;

        await ctx.reply(msg, { parse_mode: 'HTML', ...adminKeyboard });
      } else {
        await ctx.reply(
          `❌ Xush kelibsiz, @${username}! Tizimda sizning ismingizga mos foydalanuvchi topilmadi. Iltimos, avval saytda ro'yxatdan o'ting.`,
        );
      }
      return;
    }

    // Handle existing users (Admins/Super Admins)
    if (
      user &&
      user.id &&
      (user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN)
    ) {
      const isAlreadyLinked = user.telegramChatId === chatId;
      await this.prisma.user.update({
        where: { id: user.id },
        data: { telegramChatId: chatId, telegramUsername: username },
      });

      const msg = isAlreadyLinked
        ? `👋 Xush kelibsiz, <b>${user.role === UserRole.SUPERADMIN ? 'Super Admin' : 'Admin'}</b> janoblari!\n\nNimani qilmoqchisiz?`
        : `✅ Xush kelibsiz! Siz admin sifatida tanindingiz.`;

      await ctx.reply(msg, { parse_mode: 'HTML', ...adminKeyboard });
      return;
    }

    // Default: Welcome everyone and show search instructions
    const welcomeMsg = `👋 Salom, <b>${firstName}</b>!\n\n<b>YEC Market</b> botiga xush kelibsiz. Bu yerda siz o'zingizga yoqqan gilamlarni qidirishingiz va buyurtma berishingiz mumkin.\n\n🔍 Gilam qidirish uchun shunchaki uning <b>nomini</b> yoki <b>kodini</b> yozing.`;
    
    await ctx.reply(welcomeMsg, { 
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: [
          [{ text: '🔍 Mahsulot qidirish' }],
        ],
        resize_keyboard: true,
        input_field_placeholder: "Gilam nomini yozing..."
      }
    });
  }

  private async handleSearchImage(ctx: Context) {
    const chatId = ctx.chat?.id.toString();
    if (chatId) {
      this.clearSearchState(chatId);
      // Photo is handled natively without a state, but we can instruct the user
      await ctx.reply(
        "🖼 <b>Rasm bilan qidirish</b>\n\nQidirmoqchi bo'lgan gilam rasmini botga yuboring va izohiga (caption) maqsadni yozing.",
        { parse_mode: 'HTML' }
      );
    }
  }

  private async handleSearchName(ctx: Context) {
    const chatId = ctx.chat?.id.toString();
    if (chatId) {
      this.clearSearchState(chatId);
      this.searchNameState.add(chatId);
      await ctx.reply(
        "📝 <b>Nom bilan qidirish</b>\n\nGilam nomini kiriting (masalan: <i>Verona</i>):",
        { parse_mode: 'HTML' }
      );
    }
  }

  private async handleSearchCode(ctx: Context) {
    const chatId = ctx.chat?.id.toString();
    if (chatId) {
      this.clearSearchState(chatId);
      this.searchCodeState.add(chatId);
      await ctx.reply(
        "🔢 <b>Gul kodi bilan qidirish</b>\n\nGilam kodi yoki naqsh kodini kiriting:",
        { parse_mode: 'HTML' }
      );
    }
  }

  @On('callback_query')
  async onCallbackQuery(@Ctx() ctx: Context) {
    const callbackCtx = ctx as any;
    const data = callbackCtx.callbackQuery?.data;
    if (!data) return;

    await callbackCtx.answerCbQuery();

    if (!(await this.isAdmin(ctx))) {
      await ctx.reply('Bu amal faqat adminlar uchun.');
      return;
    }

    if (data === 'get_invite_link') {
      await this.handleInviteLink(ctx);
      return;
    }

    if (data === 'view_carpets') {
      await this.showSearchMenu(ctx);
      return;
    }

    if (data === 'search_image') {
      await this.handleSearchImage(ctx);
      return;
    }

    if (data === 'search_name') {
      await this.handleSearchName(ctx);
      return;
    }

    if (data === 'search_code') {
      await this.handleSearchCode(ctx);
      return;
    }

    if (data === 'new_orders') {
      await this.handleNewOrders(ctx);
      return;
    }
    if (data.startsWith('approve_admin_')) {
      const pendingChatId = data.replace('approve_admin_', '');
      const pendingInfo = this.pendingRequests.get(pendingChatId);

      if (!pendingInfo) {
        await ctx.reply(
          "⚠️ Bu so'rov endi topilmadi (allaqachon ko'rib chiqilgan bo'lishi mumkin).",
        );
        return;
      }

      this.pendingRequests.delete(pendingChatId);

      // Check if user is now in DB
      const dbUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { telegramChatId: pendingChatId },
            {
              telegramUsername:
                pendingInfo.username && pendingInfo.username !== ''
                  ? pendingInfo.username
                  : undefined,
            },
          ],
        },
      });

      if (dbUser) {
        // Promote immediately
        await this.prisma.user.update({
          where: { id: dbUser.id },
          data: {
            role: UserRole.ADMIN,
            telegramChatId: pendingChatId,
            telegramUsername: pendingInfo.username,
          },
        });
        await ctx.reply(
          `✅ <b>${pendingInfo.firstName}</b> Admin qilib tayinlandi!`,
          { parse_mode: 'HTML' },
        );
        await this.telegramService.sendRaw(
          pendingChatId,
          `🎉 Tabriklaymiz! Siz <b>Admin</b> qilib tayinlandingiz. /start deb bosing.`,
        );
      } else {
        // Pre-approve - they'll get admin when they register
        this.preApprovedChatIds.add(pendingChatId);
        await ctx.reply(
          `✅ Tasdiqlandi! <b>${pendingInfo.firstName}</b> saytda ro'yxatdan o'tgach, avtomatik Admin bo'ladi.`,
          { parse_mode: 'HTML' },
        );
        await this.telegramService.sendRaw(
          pendingChatId,
          `✅ Admin sifatida tasdiqlandi! Iltimos, <b>yecmarket.uz</b> saytida ro'yxatdan o'ting, keyin botga /start deb yozing - avtomatik Admin bo'lasiz.`,
        );
      }
      return;
    }

    if (data.startsWith('reject_admin_')) {
      const pendingChatId = data.replace('reject_admin_', '');
      const pendingInfo = this.pendingRequests.get(pendingChatId);

      if (!pendingInfo) {
        await ctx.reply("⚠️ Bu so'rov endi topilmadi.");
        return;
      }

      this.pendingRequests.delete(pendingChatId);
      this.rejectedChatIds.add(pendingChatId);

      await ctx.reply(
        `❌ <b>${pendingInfo.firstName}</b>ning so'rovi rad etildi.`,
        { parse_mode: 'HTML' },
      );
      await this.telegramService.sendRaw(
        pendingChatId,
        "❌ Kechirasiz, sizning admin bo'lish so'rovingiz rad etildi. Qo'shimcha ma'lumot uchun Super Admin bilan bog'laning.",
      );
      return;
    }
  }

  @Command('carpets')
  async onCarpets(@Ctx() ctx: Context) {
    if (!(await this.isAdmin(ctx))) {
      await ctx.reply('Bu buyruq faqat adminlar uchun.');
      return;
    }

    await this.showSearchMenu(ctx);
  }

  @On('text')
  async onText(@Ctx() ctx: Context) {
    const chatId = ctx.chat!.id.toString();
    const text = ((ctx as any).message?.text || '').trim();
    if (!text || text.startsWith('/')) return;

    const isAdmin = await this.isAdmin(ctx);

    if (isAdmin) {
      if (text === this.MENU_BACK) {
        this.clearSearchState(chatId);
        await this.showMainMenu(ctx, 'Asosiy menyu.');
        return;
      }

      if (text === '🔍 Mahsulot qidirish' || text === this.MENU_MAIN_SEARCH) {
        this.clearSearchState(chatId);
        await this.showSearchMenu(ctx);
        return;
      }

      if (text === this.MENU_SEARCH_IMAGE) {
        this.clearSearchState(chatId);
        await this.handleSearchImage(ctx);
        return;
      }

      if (text === this.MENU_SEARCH_NAME) {
        await this.handleSearchName(ctx);
        return;
      }

      if (text === this.MENU_SEARCH_CODE) {
        await this.handleSearchCode(ctx);
        return;
      }

      if (text === '📦 Buyurtmalar' || text === this.MENU_MAIN_NEW_ORDERS) {
        this.clearSearchState(chatId);
        await this.handleNewOrders(ctx);
        return;
      }

      if (text === '👤 Adminlar' || text === this.MENU_MAIN_ADD_ADMIN) {
        this.clearSearchState(chatId);
        await this.handleInviteLink(ctx);
        return;
      }
    }
    
    // Check if it's any other navigation button we might have missed
    const knownButtons = [
        '🔙 Orqaga', '✅ Tasdiqlash', '❌ Bekor qilish'
    ];
    if (knownButtons.includes(text)) return;

    // Direct search for everyone
    return this.processCarpetSearch(ctx, text);
  }

  private async processCarpetSearch(ctx: Context, query: string) {
    const chatId = ctx.chat!.id.toString();
    const priceRange = this.getPriceRangeFromSearch(query);
    const normalizedQuery = this.normalizeQuery(query);
    
    // Improved search filter
    const where = priceRange
      ? { stock: { gt: 0 } }
      : {
          OR: [
            { name: { contains: query, mode: 'insensitive' as const } },
            { name: { contains: normalizedQuery, mode: 'insensitive' as const } },
            { description: { contains: query, mode: 'insensitive' as const } },
            { category: { name: { contains: query, mode: 'insensitive' as const } } }
          ],
          stock: { gt: 0 },
        };

    const carpets = await this.prisma.carpet.findMany({
      where,
      take: 20, 
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });

    let filteredCarpets = priceRange
      ? carpets.filter((carpet) => this.matchesPriceSearch(carpet, priceRange))
      : this.rankSearchResults(query, normalizedQuery, carpets);

    // Strict code filtering for short alphanumeric queries (e.g. "02A" should not match "102A")
    if (!priceRange && query.length <= 5 && /\d/.test(query)) {
      const q = query.toLowerCase();
      const n = normalizedQuery.toLowerCase();
      filteredCarpets = filteredCarpets.filter(c => {
         const nameWords = c.name.toLowerCase().split(/[\s_-]+/);
         return nameWords.some(w => {
            if (w === q || w === n) return true;
            // Handle prefix like L102A vs 102A (allow L but not another digit)
            if (w.length > q.length && isNaN(parseInt(w[0]))) {
               return w.slice(1) === q || w.slice(1) === n;
            }
            return false;
         });
      });
    }

    if (filteredCarpets.length === 0) {
      await ctx.reply(
        `🔍 "<b>${query}</b>" bo'yicha hech qanday gilam topilmadi.`,
        { parse_mode: 'HTML' },
      );
      return;
    }

    await ctx.reply(
      `✅ Topildi: <b>${filteredCarpets.length} ta</b> natija.`,
      { parse_mode: 'HTML' },
    );

    for (const carpet of filteredCarpets) {
      const msg = `✨ <b>${carpet.name}</b> ✨\n\n` +
                  `📂 <b>Kategoriya:</b> ${carpet.category.name}\n` +
                  `💰 <b>Narxi:</b> ${Number(carpet.price).toLocaleString()} so'm / m²\n` +
                  `🧵 <b>Material:</b> ${carpet.material}\n` +
                  `📐 <b>O'lchami:</b> ${carpet.size}\n` +
                  `📦 <b>Zaxirada:</b> ${carpet.stock} ta\n\n` +
                  `🔗 <a href="https://yecmarket.uz/carpets/${carpet.id}">Veb-saytda ko'rish</a>`;

      const collectionImage = this.resolveCollectionImageForCarpet(
        carpet.name,
        carpet.description,
        carpet.category?.name,
      );
      const image = collectionImage || carpet.images?.[0]?.trim() || '';
      
      const inlineKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🛒 Saytda ko\'rish', url: `https://yecmarket.uz/carpets/${carpet.id}` }]
          ]
        }
      };

      if (image) {
        const photoInput = this.resolveCarpetPhoto(image);
        if (photoInput) {
          await this.telegramService.sendPhoto(chatId, photoInput, msg, inlineKeyboard.reply_markup);
        } else {
          await ctx.reply(msg, { parse_mode: 'HTML', ...inlineKeyboard });
        }
      } else {
        await ctx.reply(msg, { parse_mode: 'HTML', ...inlineKeyboard });
      }
    }
  }


  @Command('add_admin')
  async onAddAdmin(@Ctx() ctx: Context) {
    if (!(await this.isSuperAdmin(ctx)))
      return ctx.reply('Bu buyruq faqat Super Admin uchun.');

    const messageText = (ctx as any).message?.text || '';
    const parts = messageText.split(' ');
    if (parts.length < 2) {
      return ctx.reply('Foydalanish: /add_admin <email_yoki_tel>');
    }

    const identifier = parts[1];
    const targetUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
    });

    if (!targetUser) {
      return ctx.reply('Foydalanuvchi topilmadi.');
    }

    await this.prisma.user.update({
      where: { id: targetUser.id },
      data: { role: UserRole.ADMIN },
    });

    return ctx.reply(`${targetUser.name} endi admin!`);
  }

  @Command('invite')
  async onInvite(@Ctx() ctx: Context) {
    if (!(await this.isSuperAdmin(ctx)))
      return ctx.reply('Bu buyruq faqat Super Admin uchun.');

    const adminSecret =
      process.env.ADMIN_INVITE_SECRET || 'yec_toshkent_admin_secret_2024';
    const botUsername = ctx.botInfo.username;
    const inviteLink = `https://t.me/${botUsername}?start=admin_join_${adminSecret}`;

    return ctx.reply(
      `Yangi admin qo'shish uchun linkni bosing yoki ulashing:\n\n<a href="${inviteLink}">Admin bo'lish uchun botni ochish</a>\n\nDiqqat: Ushbu linkni faqat ishonchli odamlarga yuboring!`,
      { parse_mode: 'HTML' },
    );
  }

  @On('photo')
  async onPhoto(@Ctx() ctx: Context) {
    if (!(await this.isAdmin(ctx))) return;

    const message = (ctx as any).message;
    const caption = (message.caption || '').trim();
    if (!caption) {
      await ctx.reply("Iltimos, rasm bilan birga gilam nomini (masalan: Verona) yozib yuboring.");
      return;
    }

    const photos = message.photo;
    const bestPhoto = photos[photos.length - 1]; // largest resolution

    let firstMsg: any = null;
    let secondMsg: any = null;

    try {
      firstMsg = await ctx.reply(`🔍 "${caption}" bo'yicha bazadan qidirilyapti...`);

      const jimp = require('jimp');
      const axios = require('axios');

      const fileLink = await ctx.telegram.getFileLink(bestPhoto.file_id);
      const response = await axios.default.get(fileLink.href, { responseType: 'arraybuffer' });
      let uploadedImg = await jimp.read(Buffer.from(response.data));

      // Smart crop to focus on the carpet and remove background floor/wall
      uploadedImg = await this.smartCrop(uploadedImg);

      const normalizedCaption = this.normalizeQuery(caption);
      const carpets = await this.prisma.carpet.findMany({
        where: {
          OR: [
            { name: { contains: caption, mode: 'insensitive' } },
            { name: { contains: normalizedCaption, mode: 'insensitive' } },
            { description: { contains: caption, mode: 'insensitive' } },
          ],
        },
        include: { category: true },
      });

      if (carpets.length === 0) {
        await ctx.reply(`❌ Bazada "${caption}" nomli gilam topilmadi.`);
        return;
      }

      secondMsg = await ctx.reply(`⏳ ${carpets.length} ta "${caption}" gilamlari rasmlari bilan solishtirilmoqda...`);
      
      // Delete the first message immediately after the second one is sent
      if (firstMsg) {
        try { 
          await ctx.telegram.deleteMessage(ctx.chat!.id, firstMsg.message_id); 
          firstMsg = null;
        } catch (e) {}
      }

      const results: {carpet: any, dist: number, imgPath: string}[] = [];
      const uniqueImages = new Map<string, any>();
      
      for (const c of carpets) {
        if (c.images && c.images[0]) {
          // If we have multiple sizes of same carpet, they share the same image usually, but user wants to see "qaysi gilam", so let's keep all carpets but only hash unique images once to save time
          if (!uniqueImages.has(c.images[0])) {
            uniqueImages.set(c.images[0], { carpet: c, dist: 1 });
          }
        }
      }

       for (const [imgPath, data] of uniqueImages.entries()) {
        const photoInput = this.resolveCarpetPhoto(imgPath);
        if (photoInput && typeof photoInput !== 'string' && 'source' in photoInput) {
           try {
             const localImg = await jimp.read(photoInput.source);
             
             // Normalize both images to improve matching under different lighting
             uploadedImg.normalize();
             localImg.normalize();

             // Much higher resolution for fine "kichik detallar"
             uploadedImg.resize(256, 256);
             localImg.resize(256, 256);
 
             const structuralDist = jimp.distance(uploadedImg, localImg);
             const colorDist = this.calculateGridColorDistance(uploadedImg, localImg);
             
             // Weighted score: more robust to color/brightness shifts
             data.dist = structuralDist * 0.4 + colorDist * 0.6;
           } catch (e) {
             this.logger.warn(`Could not read local image: ${e.message}`);
           }
        }
      }

      // Re-map back to all carpets so we return exactly the sizes/carpets matched
      for (const c of carpets) {
        if (c.images && c.images[0]) {
           const match = uniqueImages.get(c.images[0]);
           if (match && match.dist < 1) {
             results.push({ carpet: c, dist: match.dist, imgPath: c.images[0] });
           }
        }
      }

      // Delete the second searching message (first one already deleted)
      if (secondMsg) {
        try { await ctx.telegram.deleteMessage(ctx.chat!.id, secondMsg.message_id); } catch (e) {}
      }

      if (results.length === 0) {
        await ctx.reply("❌ Rasm solishtirish uchun mahalliy rasmlar topilmadi yoki o'qishda xatolik yuz berdi.");
        return;
      }

      // Sort best matches first
      results.sort((a, b) => a.dist - b.dist);

      let matchesToReturn: {carpet: any, dist: number, imgPath: string}[] = [];
      const bestMatch = results[0];

      if (bestMatch.dist <= 0.08) {
        // High confidence match (improved with smart crop and weighted color)
        matchesToReturn = [bestMatch];
        await ctx.reply(`🎯 Juda aniq moslik topildi! (Moslik darajasi: ${((1 - bestMatch.dist) * 100).toFixed(1)}%)`);
      } else if (bestMatch.dist <= 0.18) {
        // Medium confidence match
        matchesToReturn = results.slice(0, 3);
        await ctx.reply(`⚠️ O'xshash gilamlar topildi. Eng yaxshi natijalar:`);
      } else {
        // Low confidence match
        await ctx.reply(`❌ Ushbu rasmga mos keladigan aniq gilam bazadan topilmadi. (Eng yaqin o'xshashlik: ${((1 - bestMatch.dist) * 100).toFixed(1)}%)`);
        return;
      }

      for (const match of matchesToReturn) {
        const carpet = match.carpet;
        const similarity = ((1 - match.dist) * 100).toFixed(1);
        const msg = `<b>${carpet.name}</b>\nKategoriya: ${carpet.category.name}\nNarxi: ${Number(carpet.price).toLocaleString()} so'm\nO'lchami: ${carpet.size}\nZaxira: ${carpet.stock} ta\n🎯 Moslik: ${similarity}%`;
        
        const photoInput = this.resolveCarpetPhoto(match.imgPath);
        if (photoInput) {
          await this.telegramService.sendPhoto(ctx.chat!.id.toString(), photoInput, msg);
        } else {
          await ctx.reply(msg, { parse_mode: 'HTML' });
        }
      }

    } catch (error) {
      if (firstMsg) {
        try { await ctx.telegram.deleteMessage(ctx.chat!.id, firstMsg.message_id); } catch (e) {}
      }
      if (secondMsg) {
        try { await ctx.telegram.deleteMessage(ctx.chat!.id, secondMsg.message_id); } catch (e) {}
      }
      this.logger.error("Rasm qidirish xatoligi:", error);
      await ctx.reply("❌ Xatolik yuz berdi. Iltimos keyinroq urinib ko'ring.");
    }
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

  private async isSuperAdmin(ctx: Context): Promise<boolean> {
    const from = ctx.from;
    if (!from) return false;
    if (from.username === this.DEFAULT_ADMIN) return true;

    const user = await this.prisma.user.findUnique({
      where: { telegramChatId: from.id.toString() },
    });
    return user?.role === UserRole.SUPERADMIN;
  }

  private resolveCarpetPhoto(
    image: string,
  ): string | { source: string } | null {
    if (!image) return null;
    const trimmed = image.trim();
    if (!trimmed) return null;

    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    const normalized = trimmed.replace(/\\/g, '/');
    const withoutLeading = normalized.replace(/^\/+/, '');

    if (withoutLeading.startsWith('images/')) {
      const local = this.resolveFrontPublicAsset(withoutLeading);
      if (local) return { source: local };

      const frontUrl = process.env.FRONTEND_URL?.replace(/\/+$/, '');
      if (frontUrl) {
        return `${frontUrl}/${withoutLeading}`;
      }
      return null;
    }

    const relativePath = withoutLeading.startsWith('uploads/')
      ? withoutLeading
      : `uploads/${withoutLeading}`;
    const localPath = join(process.cwd(), relativePath);

    if (existsSync(localPath)) {
      return { source: localPath };
    }

    const appUrl = process.env.APP_URL?.replace(/\/+$/, '');
    if (appUrl) {
      if (normalized.startsWith('/')) {
        return `${appUrl}${normalized}`;
      }
      if (normalized.startsWith('uploads/')) {
        return `${appUrl}/${normalized}`;
      }
      return `${appUrl}/uploads/${normalized}`;
    }

    return null;
  }

  private getPriceRangeFromSearch(
    search: string,
  ): { min: number; max: number } | null {
    const trimmed = search.trim();
    if (!trimmed) return null;

    if (!/^[\d\s.,]+$/.test(trimmed)) return null;

    const normalized = trimmed.replace(/\s+/g, '').replace(/,/g, '.');
    const value = Number(normalized);
    if (!Number.isFinite(value) || value <= 0) return null;

    if (value < 10) {
      const base = value * 100000;
      const hasDecimal = normalized.includes('.');
      return {
        min: Math.round(base),
        max: Math.round(base + (hasDecimal ? 9999 : 99999)),
      };
    }

    if (value < 1000) {
      const base = value * 1000;
      return { min: Math.round(base), max: Math.round(base + 999) };
    }

    return { min: Math.round(value), max: Math.round(value) };
  }

  private matchesPriceSearch(
    carpet: { price: any; size: string },
    range: { min: number; max: number },
  ): boolean {
    const perM2 = this.getPricePerM2(carpet.price, carpet.size);
    const total = Math.round(Number(carpet.price));
    const values = [
      Number.isFinite(total) ? total : null,
      perM2 ? Math.round(perM2) : null,
    ].filter((value): value is number => value !== null);

    return values.some((value) => value >= range.min && value <= range.max);
  }

  private getPricePerM2(
    totalPrice: number | string,
    size: string,
  ): number | null {
    const area = this.parseAreaFromSize(size);
    if (!area) return null;

    const price = Number(totalPrice);
    if (!Number.isFinite(price) || price <= 0) return null;

    return price / area;
  }

  private parseAreaFromSize(size: string): number | null {
    if (!size) return null;

    const normalized = size.toLowerCase().replace(/,/g, '.');
    const matches = normalized.match(/\d+(\.\d+)?/g);
    if (!matches || matches.length === 0) return null;

    const numbers = matches
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));
    if (numbers.length === 0) return null;

    if (numbers.length === 1) {
      const value = numbers[0];
      return value > 0 ? value : null;
    }

    const [rawA, rawB] = numbers;
    const hasCm = normalized.includes('cm') || normalized.includes('см');
    const useCm = hasCm || rawA > 20 || rawB > 20;
    const a = useCm ? rawA / 100 : rawA;
    const b = useCm ? rawB / 100 : rawB;
    const area = a * b;

    return area > 0 ? area : null;
  }

  private resolveCollectionImageForCarpet(
    name: string,
    description?: string | null,
    categoryName?: string | null,
  ): string | null {
    this.ensureCollectionManifestLoaded();
    if (!this.collectionCodeMap || this.collectionCodeMap.size === 0)
      return null;

    const combined = [name, description].filter(Boolean).join(' ');
    if (!combined) return null;

    const preferredSlug =
      this.resolveCollectionSlug(categoryName) ||
      this.resolveCollectionSlug(name);
    const codes = this.extractCodeCandidates(combined);

    for (const code of codes) {
      const entries = this.collectionCodeMap.get(code);
      if (!entries || entries.length === 0) continue;

      if (preferredSlug) {
        const match = entries.find((entry) => entry.slug === preferredSlug);
        if (match) return match.path;
      }

      if (entries.length === 1) {
        return entries[0].path;
      }
    }

    return null;
  }

  private resolveFrontPublicAsset(relativePath: string): string | null {
    this.ensureCollectionManifestLoaded();
    if (!this.frontPublicDir) return null;
    const fullPath = join(this.frontPublicDir, relativePath);
    return existsSync(fullPath) ? fullPath : null;
  }

  private ensureCollectionManifestLoaded(): void {
    if (this.collectionCodeMap) return;

    const manifestPath = this.resolveManifestPath();
    if (!manifestPath) {
      this.collectionCodeMap = new Map();
      this.collectionNameToSlug = new Map();
      return;
    }

    try {
      const raw = readFileSync(manifestPath, 'utf-8');
      const parsed = JSON.parse(raw) as {
        images?: Record<string, Record<string, string>>;
        collections?: { name: string; slug: string }[];
      };
      const map = new Map<string, CollectionCodeEntry[]>();
      if (parsed.images) {
        for (const [slug, group] of Object.entries(parsed.images)) {
          for (const [code, path] of Object.entries(group)) {
            const list = map.get(code) ?? [];
            list.push({ slug, path });
            map.set(code, list);
          }
        }
      }

      const nameMap = new Map<string, string>();
      if (parsed.collections) {
        for (const collection of parsed.collections) {
          const normalizedName = this.normalizeCollection(collection.name);
          const normalizedSlug = this.normalizeCollection(collection.slug);
          if (normalizedName) nameMap.set(normalizedName, collection.slug);
          if (normalizedSlug) nameMap.set(normalizedSlug, collection.slug);
        }
      }

      this.collectionCodeMap = map;
      this.collectionNameToSlug = nameMap;
      this.frontPublicDir =
        this.resolveFrontPublicDirFromManifest(manifestPath);
    } catch (e) {
      this.logger.error(`Collection manifest o'qishda xatolik: ${e.message}`);
      this.collectionCodeMap = new Map();
      this.collectionNameToSlug = new Map();
    }
  }

  private resolveManifestPath(): string | null {
    const explicit = process.env.COLLECTIONS_MANIFEST_PATH;
    const candidates = [
      explicit,
      join(
        process.cwd(),
        'front',
        'public',
        'images',
        'collections',
        'manifest.json',
      ),
      join(
        process.cwd(),
        '..',
        'front',
        'public',
        'images',
        'collections',
        'manifest.json',
      ),
      join(process.cwd(), 'public', 'images', 'collections', 'manifest.json'),
      join(
        process.cwd(),
        '..',
        'public',
        'images',
        'collections',
        'manifest.json',
      ),
    ].filter(Boolean) as string[];

    for (const path of candidates) {
      if (existsSync(path)) return path;
    }

    return null;
  }

  private resolveFrontPublicDirFromManifest(
    manifestPath: string,
  ): string | null {
    const collectionsDir = dirname(manifestPath);
    const frontPublicDir = join(collectionsDir, '..', '..');
    return existsSync(frontPublicDir) ? frontPublicDir : null;
  }

  private extractCodeCandidates(text: string): string[] {
    const upper = text.toUpperCase();
    const candidates = new Set<string>();

    const tokens = upper
      .replace(/[^A-Z0-9]+/g, ' ')
      .split(' ')
      .map((t) => t.trim())
      .filter(Boolean);

    for (const token of tokens) {
      if (token.length >= 4) {
        candidates.add(token);
      }
    }

    const regexMatches = upper.match(/[A-Z]{1,3}\d{2,4}[A-Z]{1,3}/g) || [];
    for (const match of regexMatches) {
      candidates.add(match);
    }

    return Array.from(candidates);
  }

  private resolveCollectionSlug(name?: string | null): string | null {
    if (!name) return null;
    this.ensureCollectionManifestLoaded();
    if (!this.collectionNameToSlug) return null;

    const normalized = this.normalizeCollection(name);
    if (!normalized) return null;

    const alias = this.resolveCollectionAlias(normalized);
    if (alias && this.collectionNameToSlug.has(alias)) {
      return this.collectionNameToSlug.get(alias) || null;
    }

    const direct = this.collectionNameToSlug.get(normalized);
    if (direct) return direct;

    const compact = normalized.replace(/-/g, '');
    const compactMatch = this.collectionNameToSlug.get(compact);
    if (compactMatch) return compactMatch;

    return null;
  }

  private normalizeCollection(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private resolveCollectionAlias(normalizedName: string): string {
    if (!normalizedName) return '';

    const compact = normalizedName.replace(/-/g, '');

    if (
      normalizedName === 'touch' ||
      normalizedName.startsWith('touch-') ||
      compact === 'touchgold' ||
      compact === 'touchblue'
    ) {
      return 'touch';
    }

    if (
      normalizedName === 'iran' ||
      normalizedName.startsWith('iran-') ||
      normalizedName === 'iran-soft' ||
      normalizedName === 'eron' ||
      normalizedName.startsWith('eron-') ||
      normalizedName === 'eron-soft' ||
      normalizedName === 'soft' ||
      normalizedName.startsWith('soft-')
    ) {
      return 'iran-soft';
    }

    if (
      normalizedName === 'trio' ||
      normalizedName.startsWith('trio-') ||
      compact === 'triowhite' ||
      compact === 'trioblack'
    ) {
      return 'trio';
    }

    if (
      normalizedName === 'new-luna' ||
      normalizedName.startsWith('luna-') ||
      compact === 'newluna'
    ) {
      return 'luna';
    }

    return '';
  }

  private formatPhoneNumber(value: string): string {
    const digits = (value || '').replace(/\D/g, '');
    let localDigits = '';
    if (digits.startsWith('998')) {
      localDigits = digits.slice(3, 12);
    } else {
      localDigits = digits.slice(0, 9);
    }

    const compact = localDigits.padEnd(9, '');
    return `+998${compact}`;
  }

  private normalizeQuery(query: string): string {
    const q = query.toLowerCase();
    // Common synonyms/transliterations
    if (q === 'eron' || q.includes('eron')) return q.replace('eron', 'iran');
    if (q === 'turkiya' || q.includes('turk')) return q.replace('turkiya', 'turk');
    return q;
  }

  private rankSearchResults(query: string, normalized: string, carpets: any[]): any[] {
    const q = query.toLowerCase();
    const n = normalized.toLowerCase();

    return carpets.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();

      const getScore = (name: string) => {
        if (!name) return 0;
        if (name === q || name === n) return 100; // Exact match
        if (name.startsWith(q) || name.startsWith(n)) return 80; // Starts with
        
        // Whole word match
        const words = name.split(/[\s_-]+/);
        if (words.includes(q) || words.includes(n)) return 60;

        // Substring match
        if (name.includes(q) || name.includes(n)) {
          // If it's a substring match, shorter names are usually more relevant
          // or matches closer to the start
          const idx = name.indexOf(q) !== -1 ? name.indexOf(q) : name.indexOf(n);
          return 40 - idx - name.length / 10;
        }
        return 0;
      };

      return getScore(nameB) - getScore(nameA);
    });
  }

  private calculateGridColorDistance(img1: any, img2: any): number {
    const GRID_SIZE = 16;
    const cellW = Math.floor(img1.bitmap.width / GRID_SIZE);
    const cellH = Math.floor(img1.bitmap.height / GRID_SIZE);
    
    let totalDist = 0;
    let totalWeight = 0;

    for (let gy = 0; gy < GRID_SIZE; gy++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        // Center-priority weighting: inner 8x8 region gets 2x weight
        const isCenter = gx >= 4 && gx < 12 && gy >= 4 && gy < 12;
        const weight = isCenter ? 2 : 1;

        const avg1 = this.getAverageColorInRegion(img1, gx * cellW, gy * cellH, cellW, cellH);
        const avg2 = this.getAverageColorInRegion(img2, gx * cellW, gy * cellH, cellW, cellH);

        const rD = (avg1.r - avg2.r);
        const gD = (avg1.g - avg2.g);
        const bD = (avg1.b - avg2.b);
        
        // Weighted Euclidean distance for human perception: sqrt(2*rD^2 + 4*gD^2 + 3*bD^2)
        // Normalized by max possible distance (sqrt(2*255^2 + 4*255^2 + 3*255^2) ≈ 765)
        const d = Math.sqrt(2 * rD * rD + 4 * gD * gD + 3 * bD * bD) / 765;
        
        totalDist += d * weight;
        totalWeight += weight;
      }
    }

    return totalDist / totalWeight;
  }

  private async smartCrop(img: any): Promise<any> {
    const w = img.bitmap.width;
    const h = img.bitmap.height;
    
    // Simple edge detection/content discovery
    // We sample pixels to find the bounding box that excludes low-variance outer regions
    let minX = w, maxX = 0, minY = h, maxY = 0;
    const threshold = 30; // Contrast threshold

    // Skip every few pixels for performance
    const step = 4;
    for (let y = step; y < h - step; y += step) {
      for (let x = step; x < w - step; x += step) {
        const idx = (w * y + x) << 2;
        const r = img.bitmap.data[idx];
        const g = img.bitmap.data[idx+1];
        const b = img.bitmap.data[idx+2];

        // Compare with neighbors to find edges
        const rightIdx = (w * y + (x + step)) << 2;
        const downIdx = (w * (y + step) + x) << 2;
        
        const dr = Math.abs(r - img.bitmap.data[rightIdx]);
        const dg = Math.abs(g - img.bitmap.data[rightIdx+1]);
        const db = Math.abs(b - img.bitmap.data[rightIdx+2]);
        
        const dr2 = Math.abs(r - img.bitmap.data[downIdx]);
        const dg2 = Math.abs(g - img.bitmap.data[downIdx+1]);
        const db2 = Math.abs(b - img.bitmap.data[downIdx+2]);

        if (dr > threshold || dg > threshold || db > threshold || dr2 > threshold || dg2 > threshold || db2 > threshold) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // If we found a valid "active" region, crop to it with a small margin
    if (maxX > minX && maxY > minY) {
      const margin = 10;
      const cropX = Math.max(0, minX - margin);
      const cropY = Math.max(0, minY - margin);
      const cropW = Math.min(w - cropX, (maxX - minX) + 2 * margin);
      const cropH = Math.min(h - cropY, (maxY - minY) + 2 * margin);
      
      if (cropW > w * 0.2 && cropH > h * 0.2) { // Ensure we don't crop too aggressively
        return img.clone().crop(cropX, cropY, cropW, cropH);
      }
    }
    
    return img;
  }

  private getAverageColorInRegion(img: any, x: number, y: number, w: number, h: number): { r: number; g: number; b: number } {
    let r = 0, g = 0, b = 0;
    let count = 0;

    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        const idx = (img.bitmap.width * py + px) << 2;
        if (idx < 0 || idx >= img.bitmap.data.length) continue;
        r += img.bitmap.data[idx];
        g += img.bitmap.data[idx + 1];
        b += img.bitmap.data[idx + 2];
        count++;
      }
    }

    return {
      r: Math.round(r / (count || 1)),
      g: Math.round(g / (count || 1)),
      b: Math.round(b / (count || 1)),
    };
  }
}
