import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCarpetDto } from './dto/create-carpet.dto';
import { CarpetQueryDto } from './dto/carpet-query.dto';
import { UpdateCarpetDto } from './dto/update-carpet.dto';
import { UpdateCarpetDiscountDto } from './dto/update-carpet-discount.dto';
import { UpdateCarpetM2PriceDto } from './dto/update-carpet-m2-price.dto';

// Each group: the first element is the canonical/stored name,
// the rest are common typos, transliterations, and abbreviations users might type.
const MATERIAL_SYNONYMS: string[][] = [
  [
    'acrylic',
    'akril',
    'akriyil',
    'acril',
    'acrili',
    'akrilik',
    'akrilic',
    'akrilk',
    'akrylic',
    'acryl',
  ],
  [
    'micro-polister',
    'micro polister',
    'micro-polyester',
    'micropolyester',
    'micropolister',
    'mikropolister',
    'mikro-polister',
    'mikro polister',
    'polister',
    'polistir',
    'poliester',
    'polyester',
    'poliestr',
    'polistr',
    'pollister',
    'polyestr',
    'polistyr',
  ],
  [
    'polypropylene',
    'polipropyline',
    'polipropylen',
    'polipropilen',
    'polipropilin',
    'poliproplin',
    'poliprofin',
    'poliprofel',
    'polipropin',
    'polipropil',
    'poliprop',
    'polypropilen',
    'polipropelin',
    'polipropiyen',
    'propilen',
    'proplin',
  ],
  [
    'ipak',
    'silk',
    'ipek',
    'ipk',
    'ipag',
    'ipakk',
    'shilk',
    'shelk',
    'shoyi',
    "sho'yi",
  ],
  ['jun', 'wool', 'jung', "jun'", 'junn', 'vul', 'vool', 'yun', 'yung'],
  ['bambuk', 'bamboo', 'bambuc', 'bambk', 'bambu', 'banbuk'],
  ['viscose', 'viskoz', 'viskoza', 'viscoza', 'viskos', 'viscos', 'viskose'],
  ['nylon', 'naylon', 'nilon', 'neylon', 'nailon'],
  ['cotton', 'koton', 'paxta', 'pahta', 'pakhta', 'cottton'],
  ['chenille', 'shenil', 'shenill', 'chenil', 'chenile', 'sheniyl'],
  ['jute', 'jut', 'djut', 'dyut', 'dzhut'],
];

const METRAJ_TAG = '[METRAJ]';
const PRAYER_KEYWORD = 'joynamoz';
const OVAL_KEYWORD = 'oval';

const normalizeSizeDims = (raw: string): number[] => {
  const normalized = String(raw || '').toLowerCase().replace(/,/g, '.');
  const matches = normalized.match(/\d+(\.\d+)?/g);
  if (!matches || matches.length === 0) return [];

  const numbers = matches
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);
  if (numbers.length === 0) return [];

  const sorted = [...numbers].sort((a, b) => a - b);
  const hasCm = normalized.includes('cm') || normalized.includes('\u0441\u043c');
  const useCm = hasCm || sorted.some((value) => value > 20);

  return sorted
    .map((value) => (useCm ? value : value * 100))
    .map((value) => Math.round(value));
};

const buildSizePatterns = (a: number, b: number): string[] => {
  const separators = ['x', '×', '*'];
  const patterns = new Set<string>();

  for (const sep of separators) {
    patterns.add(`${a}${sep}${b}`);
    patterns.add(`${b}${sep}${a}`);
    patterns.add(`${a} ${sep} ${b}`);
    patterns.add(`${b} ${sep} ${a}`);
  }

  return Array.from(patterns);
};

@Injectable()
export class CarpetsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      const carpets = await this.prisma.carpet.findMany({ select: { id: true } });
      for (const carpet of carpets) {
        const count = await this.prisma.carpetLike.count({
          where: { carpetId: carpet.id },
        });
        await this.prisma.carpet.update({
          where: { id: carpet.id },
          data: { likes: count },
        });
      }
    } catch (error) {
      console.error('Error syncing carpet likes:', error);
    }
  }

  /**
   * Given a user's material query, find all synonym keywords that should be searched.
   * Returns an array of keywords to OR-search against.
   */
  private resolveMaterialKeywords(input: string): string[] {
    const q = input.trim().toLowerCase();
    if (!q) return [];

    const queryVariants = this.buildMaterialQueryVariants(q);

    const matchedGroups: string[][] = [];
    for (const group of MATERIAL_SYNONYMS) {
      if (this.matchesMaterialGroup(queryVariants, group)) {
        matchedGroups.push(group);
      }
    }

    const keywords = new Set<string>();

    if (matchedGroups.length === 0) {
      // No synonym group matched - fall back to query variants
      queryVariants.forEach((variant) => keywords.add(variant));
      return Array.from(keywords);
    }

    // Collect all unique keywords from matched groups + query variants
    for (const group of matchedGroups) {
      for (const word of group) {
        keywords.add(word);
      }
    }
    queryVariants.forEach((variant) => keywords.add(variant));

    return Array.from(keywords);
  }

  /**
   * Simple fuzzy comparison: true if edit distance is within a small threshold
   * based on the string length, or if one string starts with the other.
   */
  private fuzzyMatch(a: string, b: string): boolean {
    if (!a || !b) return false;
    if (a.startsWith(b) || b.startsWith(a)) return true;

    const len1 = a.length;
    const len2 = b.length;
    const maxLen = Math.max(len1, len2);
    if (maxLen < 3) return false;

    const threshold = maxLen <= 5 ? 1 : maxLen <= 8 ? 2 : maxLen <= 12 ? 3 : 4;
    if (Math.abs(len1 - len2) > threshold) return false;

    // Levenshtein distance <= threshold
    if (len1 === 0 || len2 === 0) return false;
    const matrix: number[][] = [];
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost,
        );
      }
    }
    return matrix[len1][len2] <= threshold;
  }

  private normalizeMaterialToken(value: string): string {
    return value
      .toLowerCase()
      .replace(/[']/g, '')
      .replace(/[^a-z0-9]+/g, '');
  }

  private buildMaterialQueryVariants(value: string): string[] {
    const base = value.trim().toLowerCase();
    if (!base) return [];

    const variants = new Set<string>();
    const add = (v: string) => {
      const trimmed = v.trim();
      if (trimmed.length >= 2) variants.add(trimmed);
    };

    add(base);
    add(base.replace(/\s+/g, ' '));
    add(base.replace(/\s+/g, '-'));
    add(base.replace(/[\s-]+/g, ''));

    const tokens = base
      .split(/[\s+/_-]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    tokens.forEach((token) => add(token));

    return Array.from(variants);
  }

  private matchesMaterialGroup(
    queryVariants: string[],
    group: string[],
  ): boolean {
    const normalizedQueries = queryVariants
      .map((q) => this.normalizeMaterialToken(q))
      .filter(Boolean);

    for (const synonym of group) {
      const rawSyn = synonym.toLowerCase();
      const normSyn = this.normalizeMaterialToken(rawSyn);

      for (const q of queryVariants) {
        if (!q) continue;
        if (rawSyn.includes(q) || q.includes(rawSyn)) return true;
      }

      for (const q of normalizedQueries) {
        if (!q) continue;
        if (normSyn.includes(q) || q.includes(normSyn)) return true;
        if (this.fuzzyMatch(q, normSyn)) return true;
      }
    }

    return false;
  }
  async create(dto: CreateCarpetDto) {
    if ((dto.description ?? '').includes(METRAJ_TAG)) {
      throw new BadRequestException("Metraj gilamlar vaqtincha o'chirilgan.");
    }

    if (Number(dto.price) <= 0) {
      throw new BadRequestException("Narx 0 dan katta bo'lishi kerak.");
    }
    if (Number(dto.stock) < 0) {
      throw new BadRequestException("Miqdor manfiy bo'lishi mumkin emas.");
    }

    const category = await this.ensureCategoryExists(dto.categoryId);
    const isOvalCategory = this.isOvalCategoryName(category.name);
    const normalizedDesignCode = this.resolveDesignCode(
      dto.designCode,
      dto.name,
    );
    if (isOvalCategory && !normalizedDesignCode) {
      throw new BadRequestException("Oval gilamlar uchun gul kodi majburiy.");
    }

    const normalizedData = this.normalizeCarpetData(dto);
    const normalizedName = (normalizedData.name ?? dto.name ?? '').trim();
    const normalizedSize = (normalizedData.size ?? dto.size ?? '').trim();

    if (normalizedName && normalizedSize) {
      const existing = await this.prisma.carpet.findFirst({
        where: {
          name: normalizedName,
          size: normalizedSize,
          categoryId: dto.categoryId,
          NOT: { description: { contains: METRAJ_TAG } },
        },
        include: { category: true },
      });

      if (existing) {
        return this.prisma.carpet.update({
          where: { id: existing.id },
          data: { stock: { increment: dto.stock } },
          include: { category: true },
        });
      }
    }
    const carpet = await this.prisma.carpet.create({
      data: {
        ...dto,
        ...normalizedData,
        price: dto.price,
        designCode: normalizedDesignCode,
      },
      include: { category: true },
    });

    // Price consistency logic
    const isPrayer = carpet.category?.name.toLowerCase().includes(PRAYER_KEYWORD);
    if (!isPrayer) {
      await this.propagateCollectionM2Price({
        id: carpet.id,
        name: carpet.name,
        size: carpet.size,
        price: carpet.price,
      });
    }

    return carpet;
  }

  async findAll(query: CarpetQueryDto, userId?: string) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const kind = query.kind?.toLowerCase();

    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      throw new BadRequestException(
        "Minimal narx maksimal narxdan katta bo'lmasligi kerak.",
      );
    }

    // Build material filter with synonym matching
    let materialFilter: any = undefined;
    if (query.material) {
      const keywords = this.resolveMaterialKeywords(query.material);
      if (keywords.length === 1) {
        materialFilter = {
          contains: keywords[0],
          mode: 'insensitive' as const,
        };
      } else if (keywords.length > 1) {
        materialFilter = undefined; // handled via OR below
      }
    }

    const searchStr = (query.search || '').toLowerCase().trim();
    const eronVariants = ['eron', 'iran', 'eron-soft', 'eron soft', 'iran-soft', 'iran soft', 'soft'];
    const isEronSearch = eronVariants.some(v => searchStr.includes(v));

    // Build search query with improved dimensions matching
    let searchConditions: any[] = [];
    if (query.search) {
      const searchText = isEronSearch ? 'iran-soft' : query.search;
      const syns = this.resolveMaterialKeywords(query.search);

      // Basic text search in Name, Size, Description
      searchConditions = [
        { name: { contains: searchText, mode: 'insensitive' as const } },
        { size: { contains: query.search, mode: 'insensitive' as const } },
        { description: { contains: query.search, mode: 'insensitive' as const } },
        { designCode: { contains: query.search, mode: 'insensitive' as const } },
        ...syns.map((s) => ({
          description: { contains: s, mode: 'insensitive' as const },
        })),
      ];

      // Smart Dimension Matching: if user types "0.75", also match "75" in Size
      const numbersInSearch = query.search.match(/(\d+(\.\d+)?)/g)?.map(Number) || [];
      numbersInSearch.forEach(n => {
        if (n < 15) {
          const normalized = Math.round(n * 100);
          searchConditions.push({ size: { contains: String(normalized), mode: 'insensitive' as const } });
        }
      });
    }

    const where: any = {
      ...(searchConditions.length > 0 ? { OR: searchConditions } : {}),
      categoryId: query.categoryId,
      material: materialFilter,
      price: {
        gte: query.minPrice,
        lte: query.maxPrice,
      },
      ...(!query.showAll ? { stock: { gt: 0 } } : {}),
    };

    const andConditions: any[] = [
      { NOT: { description: { contains: METRAJ_TAG } } },
    ];

    if (isEronSearch) {
      andConditions.push({
        NOT: { name: { contains: 'verona', mode: 'insensitive' as const } },
      });
    }

    if (kind === 'prayer') {
      andConditions.push({
        category: {
          name: { contains: PRAYER_KEYWORD, mode: 'insensitive' as const },
        },
      });
    } else if (kind === 'oval') {
      andConditions.push({
        category: {
          name: { contains: OVAL_KEYWORD, mode: 'insensitive' as const },
        },
      });
    } else if (kind === 'carpet') {
      andConditions.push(
        {
          NOT: {
            category: {
              name: { contains: PRAYER_KEYWORD, mode: 'insensitive' as const },
            },
          },
        },
        {
          NOT: {
            category: {
              name: { contains: OVAL_KEYWORD, mode: 'insensitive' as const },
            },
          },
        },
      );
    }

    // If multiple material keywords, use OR to match any of them
    if (query.material) {
      const keywords = this.resolveMaterialKeywords(query.material);
      if (keywords.length > 1) {
        where.OR = keywords.map((kw) => ({
          material: { contains: kw, mode: 'insensitive' as const },
        }));
      }
    }

    if (query.size) {
      const dims = normalizeSizeDims(query.size);

      if (dims.length >= 2) {
        const [a, b] = dims;
        const patterns = buildSizePatterns(a, b);
        andConditions.push({
          OR: patterns.map((pattern) => ({
            size: { contains: pattern, mode: 'insensitive' as const },
          })),
        });
      } else if (dims.length === 1) {
        andConditions.push({
          size: { contains: String(dims[0]), mode: 'insensitive' as const },
        });
      }
    }

    if (andConditions.length > 0) {
      where.AND = [...(where.AND ?? []), ...andConditions];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (query.sortBy === 'popular') {
      orderBy = { likes: 'desc' };
    } else if (query.sortBy === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (query.sortBy === 'price_desc') {
      orderBy = { price: 'desc' };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.carpet.findMany({
        where,
        include: { category: true },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.carpet.count({ where }),
    ]);

    let likedIds = new Set<string>();
    if (userId) {
      const likes = await this.prisma.carpetLike.findMany({
        where: { userId, carpetId: { in: items.map((i) => i.id) } },
      });
      likedIds = new Set(likes.map((l) => l.carpetId));
    }

    const itemsWithLikes = items.map((item) => ({
      ...item,
      isLiked: likedIds.has(item.id),
    }));

    return {
      items: itemsWithLikes,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId?: string) {
    const carpet = await this.prisma.carpet.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!carpet || (carpet.description ?? '').includes(METRAJ_TAG)) {
      throw new NotFoundException('Gilam topilmadi.');
    }

    let isLiked = false;
    if (userId) {
      const like = await this.prisma.carpetLike.findUnique({
        where: { userId_carpetId: { userId, carpetId: id } },
      });
      isLiked = !!like;
    }

    return { ...carpet, isLiked };
  }

  async toggleLike(carpetId: string, userId: string) {
    const carpet = await this.prisma.carpet.findUnique({ where: { id: carpetId } });
    if (!carpet) {
      throw new NotFoundException('Gilam topilmadi.');
    }

    const existingLike = await this.prisma.carpetLike.findUnique({
      where: { userId_carpetId: { userId, carpetId } },
    });

    if (existingLike) {
      // Unlike
      await this.prisma.carpetLike.delete({ where: { id: existingLike.id } });
      const updated = await this.prisma.carpet.update({
        where: { id: carpetId },
        data: { likes: { decrement: 1 } },
      });
      return { liked: false, likes: updated.likes };
    } else {
      // Like
      await this.prisma.carpetLike.create({
        data: { userId, carpetId },
      });
      const updated = await this.prisma.carpet.update({
        where: { id: carpetId },
        data: { likes: { increment: 1 } },
      });
      return { liked: true, likes: updated.likes };
    }
  }

  async findLikedCarpets(userId: string) {
    const likes = await this.prisma.carpetLike.findMany({
      where: { userId },
      include: {
        carpet: {
          include: { category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return likes.map((like) => ({
      ...like.carpet,
      isLiked: true,
    }));
  }

  async update(id: string, dto: UpdateCarpetDto) {
    const existing = await this.prisma.carpet.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!existing || (existing.description ?? '').includes(METRAJ_TAG)) {
      throw new NotFoundException('Gilam topilmadi.');
    }

    if ((dto.description ?? '').includes(METRAJ_TAG)) {
      throw new BadRequestException("Metraj gilamlar vaqtincha o'chirilgan.");
    }

    let categoryName = existing.category?.name ?? '';
    if (dto.categoryId) {
      const category = await this.ensureCategoryExists(dto.categoryId);
      categoryName = category.name;
    }

    if (dto.price !== undefined && Number(dto.price) <= 0) {
      throw new BadRequestException("Narx 0 dan katta bo'lishi kerak.");
    }
    if (dto.stock !== undefined && Number(dto.stock) < 0) {
      throw new BadRequestException("Miqdor manfiy bo'lishi mumkin emas.");
    }

    const normalizedData = this.normalizeCarpetData(dto);
    const hasDesignCodeField = Object.prototype.hasOwnProperty.call(
      dto,
      'designCode',
    );
    const nextName = normalizedData.name ?? dto.name ?? existing.name;
    const designCodeSeed = hasDesignCodeField ? dto.designCode : existing.designCode;
    const normalizedDesignCode = this.resolveDesignCode(designCodeSeed, nextName);
    const isOvalCategory = this.isOvalCategoryName(categoryName);
    if (isOvalCategory && !normalizedDesignCode) {
      throw new BadRequestException("Oval gilamlar uchun gul kodi majburiy.");
    }

    const updateData: any = {
      ...dto,
      ...normalizedData,
    };
    if (hasDesignCodeField || isOvalCategory || dto.name !== undefined) {
      updateData.designCode = normalizedDesignCode;
    }
    if (dto.price !== undefined) {
      updateData.price = dto.price;
    }

    let updated: any;
    
    // Automatically delete the carpet if the stock is being set to 0
    if (updateData.stock === 0) {
      updated = await this.prisma.carpet.delete({
        where: { id },
        include: { category: true },
      });
    } else {
      updated = await this.prisma.carpet.update({
        where: { id },
        data: updateData,
        include: { category: true },
      });
    }

    // Price consistency logic
    const isPrayer = updated.category?.name.toLowerCase().includes(PRAYER_KEYWORD);
    if (!isPrayer && dto.price !== undefined && updateData.stock !== 0) {
      await this.propagateCollectionM2Price({
        id: updated.id,
        name: updated.name,
        size: updated.size,
        price: updated.price,
      });
    }

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.carpet.delete({ where: { id } });
  }

  async getDistinctNames(kind?: string) {
    const andConditions: any[] = [
      { NOT: { description: { contains: METRAJ_TAG } } },
    ];

    if (kind === 'prayer') {
      andConditions.push({
        category: {
          name: { contains: PRAYER_KEYWORD, mode: 'insensitive' as const },
        },
      });
    } else if (kind === 'oval') {
      andConditions.push({
        category: {
          name: { contains: OVAL_KEYWORD, mode: 'insensitive' as const },
        },
      });
    } else if (kind === 'carpet') {
      andConditions.push({
        NOT: {
          category: {
            name: { contains: PRAYER_KEYWORD, mode: 'insensitive' as const },
          },
        },
      });
      andConditions.push({
        NOT: {
          category: {
            name: { contains: OVAL_KEYWORD, mode: 'insensitive' as const },
          },
        },
      });
    }

    const rows = await this.prisma.carpet.findMany({
      where: { AND: andConditions },
      select: { name: true },
      orderBy: { name: 'asc' },
    });

    const grouped = new Map<string, string>();
    for (const row of rows) {
      const collectionName = this.extractCollectionName(row.name);
      const key = this.normalizeCollectionKey(collectionName);
      if (!key || grouped.has(key)) continue;
      grouped.set(key, collectionName);
    }

    return Array.from(grouped.values()).sort((a, b) =>
      a.localeCompare(b, 'uz', { sensitivity: 'base' }),
    );
  }

  async getCollectionM2Price(name: string) {
    const sourceName = String(name ?? '').trim();
    if (!sourceName) {
      throw new BadRequestException("Gilam nomini kiriting.");
    }

    const collectionName = this.extractCollectionName(sourceName);
    const key = this.normalizeCollectionKey(collectionName);
    if (!key) {
      throw new BadRequestException("Gilam nomini kiriting.");
    }

    const carpets = await this.findCarpetsByCollectionKeys([key]);
    if (carpets.length === 0) {
      return {
        found: false,
        collectionName,
        m2Price: null,
        count: 0,
      };
    }

    let sumM2 = 0;
    let validCount = 0;
    for (const carpet of carpets) {
      const area = this.parseAreaFromSize(carpet.size);
      const totalPrice = Number(carpet.price);
      if (!area || area <= 0 || !Number.isFinite(totalPrice) || totalPrice <= 0) {
        continue;
      }
      sumM2 += totalPrice / area;
      validCount += 1;
    }

    if (validCount === 0) {
      return {
        found: false,
        collectionName,
        m2Price: null,
        count: 0,
      };
    }

    const m2Price = Math.round((sumM2 / validCount) * 100) / 100;

    return {
      found: true,
      collectionName,
      m2Price,
      count: validCount,
    };
  }

  async updateDiscountByNames(dto: UpdateCarpetDiscountDto) {
    const uniqueNames = Array.from(
      new Set(
        (dto.names ?? [])
          .map((value) => String(value ?? '').trim())
          .filter(Boolean)
          .map((value) => this.extractCollectionName(value)),
      ),
    );

    if (uniqueNames.length === 0) {
      throw new BadRequestException("Kamida bitta gilam nomini tanlang.");
    }

    const percent = Math.round(Number(dto.discountPercent));
    if (!Number.isFinite(percent)) {
      throw new BadRequestException("Skidka foizi noto'g'ri kiritildi.");
    }

    const discountPercent = Math.min(99, Math.max(0, percent));

    const keys = Array.from(
      new Set(
        uniqueNames
          .map((name) => this.normalizeCollectionKey(name))
          .filter(Boolean),
      ),
    );

    if (keys.length === 0) {
      throw new BadRequestException("Kamida bitta gilam nomini tanlang.");
    }

    const targetCarpets = await this.findCarpetsByCollectionKeys(keys);
    const standardizedCount =
      targetCarpets.length > 0
        ? await this.standardizeCollectionPricesByAverage(targetCarpets)
        : 0;

    const ids = targetCarpets.map((item) => item.id);
    const result =
      ids.length === 0
        ? { count: 0 }
        : await this.prisma.carpet.updateMany({
            where: { id: { in: ids } },
            data: { discountPercent },
          });

    return {
      discountPercent,
      updatedCount: result.count,
      names: uniqueNames,
      standardizedCount,
    };
  }

  async updateM2PriceByNames(dto: UpdateCarpetM2PriceDto) {
    const uniqueNames = Array.from(
      new Set(
        (dto.names ?? [])
          .map((value) => String(value ?? '').trim())
          .filter(Boolean)
          .map((value) => this.extractCollectionName(value)),
      ),
    );

    if (uniqueNames.length === 0) {
      throw new BadRequestException("Kamida bitta gilam nomini tanlang.");
    }

    const m2Price = Number(dto.m2Price);
    if (!Number.isFinite(m2Price) || m2Price <= 0) {
      throw new BadRequestException("m2 narxi noto'g'ri kiritildi.");
    }

    const keys = Array.from(
      new Set(
        uniqueNames
          .map((name) => this.normalizeCollectionKey(name))
          .filter(Boolean),
      ),
    );

    if (keys.length === 0) {
      throw new BadRequestException("Kamida bitta gilam nomini tanlang.");
    }

    const targetCarpets = await this.findCarpetsByCollectionKeys(keys);
    const updates: any[] = [];

    for (const carpet of targetCarpets) {
      const area = this.parseAreaFromSize(carpet.size);
      if (!area || area <= 0) continue;

      const nextPrice = Math.round(m2Price * area);
      const currentPrice = Math.round(Number(carpet.price));
      if (!Number.isFinite(nextPrice) || nextPrice <= 0 || nextPrice === currentPrice) {
        continue;
      }

      updates.push(
        this.prisma.carpet.update({
          where: { id: carpet.id },
          data: { price: nextPrice },
        }),
      );
    }

    if (updates.length > 0) {
      await this.prisma.$transaction(updates);
    }

    return {
      m2Price: Math.round(m2Price * 100) / 100,
      updatedCount: updates.length,
      names: uniqueNames,
    };
  }

  private extractCollectionName(rawName: string): string {
    let source = String(rawName ?? '').trim();
    if (!source) return '';

    // Ignore 'oval' prefix/suffix so oval carpets map to the same collection
    source = source.replace(/\boval\b/gi, '').trim().replace(/\s+/g, ' ');

    const parts = source.split(' ');
    while (
      parts.length > 1 &&
      this.isLikelyDesignCodeToken(parts[parts.length - 1])
    ) {
      parts.pop();
    }

    return parts.join(' ').trim();
  }

  private isLikelyDesignCodeToken(rawToken: string): boolean {
    const token = String(rawToken ?? '').trim();
    if (!token) return false;

    const normalized = token.replace(/[^a-z0-9]/gi, '');
    if (!normalized || !/\d/.test(normalized)) return false;

    return /^[a-z]{0,4}\d{1,6}[a-z0-9]{0,4}$/i.test(normalized);
  }

  private normalizeCollectionKey(rawName: string): string {
    return this.extractCollectionName(rawName)
      .toLowerCase()
      .replace(/[\u2019'`"]/g, '')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
  }

  private isOvalCategoryName(rawName?: string): boolean {
    return String(rawName ?? '')
      .toLowerCase()
      .includes(OVAL_KEYWORD);
  }

  private normalizeDesignCode(rawCode?: string | null): string | undefined {
    const trimmed = String(rawCode ?? '').trim();
    if (!trimmed) return undefined;
    return trimmed.toUpperCase();
  }

  private extractDesignCodeFromName(rawName?: string): string | undefined {
    const source = String(rawName ?? '').trim();
    if (!source) return undefined;

    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length < 2) return undefined;

    const tail = parts[parts.length - 1].replace(/^#/, '');
    if (!this.isLikelyDesignCodeToken(tail)) return undefined;

    return this.normalizeDesignCode(tail);
  }

  private resolveDesignCode(
    rawCode?: string | null,
    rawName?: string | null,
  ): string | undefined {
    return (
      this.normalizeDesignCode(rawCode) ??
      this.extractDesignCodeFromName(rawName ?? undefined)
    );
  }

  private async findCarpetsByCollectionKeys(
    collectionKeys: string[],
    options?: { includePrayer?: boolean },
  ) {
    if (collectionKeys.length === 0) return [];

    const keySet = new Set(collectionKeys);
    const includePrayer = options?.includePrayer ?? false;
    const andConditions: any[] = [
      { NOT: { description: { contains: METRAJ_TAG } } },
    ];

    if (!includePrayer) {
      andConditions.push({
        NOT: {
          category: {
            name: { contains: PRAYER_KEYWORD, mode: 'insensitive' as const },
          },
        },
      });
    }

    const rows = await this.prisma.carpet.findMany({
      where: { AND: andConditions },
      select: { id: true, name: true, size: true, price: true },
    });

    return rows.filter((row) =>
      keySet.has(this.normalizeCollectionKey(row.name)),
    );
  }

  private async propagateCollectionM2Price(reference: {
    id: string;
    name: string;
    size: string;
    price: unknown;
  }): Promise<void> {
    const key = this.normalizeCollectionKey(reference.name);
    if (!key) return;

    const area = this.parseAreaFromSize(reference.size);
    const referencePrice = Number(reference.price);
    if (!area || area <= 0 || !Number.isFinite(referencePrice) || referencePrice <= 0) {
      return;
    }

    const m2Price = referencePrice / area;
    if (!Number.isFinite(m2Price) || m2Price <= 0) return;

    const rows = await this.prisma.carpet.findMany({
      where: {
        AND: [
          { id: { not: reference.id } },
          { NOT: { description: { contains: METRAJ_TAG } } },
          {
            NOT: {
              category: {
                name: { contains: PRAYER_KEYWORD, mode: 'insensitive' as const },
              },
            },
          },
        ],
      },
      select: { id: true, name: true, size: true, price: true },
    });

    const updates: any[] = [];
    for (const row of rows) {
      if (this.normalizeCollectionKey(row.name) !== key) continue;

      const areaValue = this.parseAreaFromSize(row.size);
      if (!areaValue || areaValue <= 0) continue;

      const nextPrice = Math.round(m2Price * areaValue);
      const currentPrice = Math.round(Number(row.price));
      if (!Number.isFinite(nextPrice) || nextPrice <= 0 || nextPrice === currentPrice) {
        continue;
      }

      updates.push(
        this.prisma.carpet.update({
          where: { id: row.id },
          data: { price: nextPrice },
        }),
      );
    }

    if (updates.length > 0) {
      await this.prisma.$transaction(updates);
    }
  }

  private async standardizeCollectionPricesByAverage(
    carpets: Array<{ id: string; name: string; size: string; price: unknown }>,
  ): Promise<number> {
    if (carpets.length === 0) return 0;

    const grouped = new Map<string, Array<{ id: string; size: string; price: unknown }>>();

    for (const carpet of carpets) {
      const key = this.normalizeCollectionKey(carpet.name);
      if (!key) continue;
      const current = grouped.get(key) ?? [];
      current.push({ id: carpet.id, size: carpet.size, price: carpet.price });
      grouped.set(key, current);
    }

    const updates: any[] = [];

    for (const [, group] of grouped) {
      let sumM2Price = 0;
      let validCount = 0;

      for (const carpet of group) {
        const area = this.parseAreaFromSize(carpet.size);
        const currentPrice = Number(carpet.price);
        if (!area || area <= 0 || !Number.isFinite(currentPrice) || currentPrice <= 0) {
          continue;
        }
        sumM2Price += currentPrice / area;
        validCount += 1;
      }

      if (validCount === 0) continue;
      const avgM2Price = sumM2Price / validCount;

      for (const carpet of group) {
        const area = this.parseAreaFromSize(carpet.size);
        if (!area || area <= 0) continue;

        const nextPrice = Math.round(avgM2Price * area);
        const currentPrice = Math.round(Number(carpet.price));
        if (!Number.isFinite(nextPrice) || nextPrice <= 0 || nextPrice === currentPrice) {
          continue;
        }

        updates.push(
          this.prisma.carpet.update({
            where: { id: carpet.id },
            data: { price: nextPrice },
          }),
        );
      }
    }

    if (updates.length > 0) {
      await this.prisma.$transaction(updates);
    }

    return updates.length;
  }

  private parseAreaFromSize(size: string): number | null {
    if (!size) return null;
    const normalized = size.toLowerCase().replace(/,/g, '.');
    const matches = normalized.match(/\d+(\.\d+)?/g);
    if (!matches || matches.length === 0) return null;

    const numbers = matches.map((value) => Number(value)).filter((value) => Number.isFinite(value));
    if (numbers.length === 0) return null;

    if (numbers.length === 1) {
      const value = numbers[0];
      return value > 0 ? value : null;
    }

    const [rawA, rawB] = numbers;
    // Assume cm if any value > 20 or if it contains 'cm'
    const hasCm = normalized.includes('cm') || normalized.includes('см');
    const useCm = hasCm || rawA > 20 || rawB > 20;
    const a = useCm ? rawA / 100 : rawA;
    const b = useCm ? rawB / 100 : rawB;
    return a * b;
  }

  private normalizeCarpetData(dto: CreateCarpetDto | UpdateCarpetDto) {
    const updates: any = {};

    if (dto.name) {
      updates.name = dto.name.charAt(0).toUpperCase() + dto.name.slice(1);
    }

    if (dto.size) {
      const nums = dto.size.match(/(\d+(\.\d+)?)/g)?.map(Number) || [];
      if (nums.length >= 2) {
        // Sort to ensure smaller dimension comes first
        nums.sort((a, b) => a - b);
        // Convert to cm if < 15 (assuming meters)
        const normalized = nums.map((n) => (n < 15 ? n * 100 : n));
        updates.size = `${normalized[0]}x${normalized[1]}`;
      }
    }

    return updates;
  }

  private async ensureCategoryExists(categoryId: string): Promise<{
    id: string;
    name: string;
  }> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true },
    });

    if (!category) {
      throw new NotFoundException('Kategoriya topilmadi.');
    }

    return category;
  }
}



