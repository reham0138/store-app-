/** Pure text helpers: normalisation, language detection and intent detection. */

export type Language = 'ar' | 'en';

export function normalize(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '') // diacritics and tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/(\d)[,٬](?=\d{3}(?!\d))/g, '$1')
    .replace(/[^\p{L}\p{N}.]+/gu, ' ')
    .replace(/(?<!\d)\.|\.(?!\d)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Any Arabic letter means an Arabic reply: Arabic shoppers often type Latin product names. */
export function detectLanguage(message: string): Language {
  if (/[ء-ي]/.test(message)) return 'ar';
  return /[a-z]/i.test(message) ? 'en' : 'ar';
}

/** Whole-word Arabic match, allowing common attached prefixes and pronoun suffixes. */
function arabic(alternatives: string): RegExp {
  return new RegExp(
    `(?<!\\p{L})(?:و|ف)?(?:هال|ب|ل|ع)?(?:ال|ل)?(?:${alternatives})(?:ه|ها|و|ك|كن|كم|هم|ا)?(?!\\p{L})`,
    'u',
  );
}

function english(alternatives: string): RegExp {
  return new RegExp(`\\b(?:${alternatives})\\b`);
}

// All Arabic patterns are written in normalised form (ا for أ, ه for ة, ي for ى/ئ).
const PATTERNS = {
  price: [arabic('سعر|اسعار|حق|ثمن|تمن|تكلفه|تكلفت|كلفه|كلفت|بكم|بقديش|بقدي|بيكلف|يكلف'), english('prices?|costs?')],
  howMuch: [arabic('قديش|اديش|اديه|كم'), english('how much')],
  stock: [arabic('مخزون|متوفر|متوفره|متاح|متاحه|موجود|موجوده|توفر|توفره|كميه|كميت|قطعه|قطع|ضل|باقي|مخلص'), english('stock|available|availability|quantity|left|sold out|how many|where can i (?:find|get|buy)'),
    /(?<!\p{L})(?:في|لسا|ضل) (?:عندكم )?(?:منه|منها|منو)(?!\p{L})|(?<!\p{L})(?:وين|فين) (?:بلاقي|الاقي)/u],
  description: [arabic('مواصفات|مواصفه|وصف|اوصاف|ميزات|ميزه|مميزات|اشرح|اشرحلي|شرح'), english('description|describe|specs?|specifications?|features?|what is (?:it|this)')],
  details: [arabic('تفاصيل|تفاصيلو|معلومات|احكيلي|خبرني|عرفني'), english('details?|info|information|tell me (?:more )?about')],
  rating: [arabic('تقييم|تقييمات|تقيم|مقيم|مراجعه|مراجعات|اراء|ريفيو|نجوم'), english('ratings?|reviews?|stars|rated')],
  // "فئة" normalises to "فيه" (also "in it"), so it needs an article or pronoun.
  category: [arabic('تصنيف|قسم'), /(?:ال|هال)فيه(?!\p{L})|(?<!\p{L})فيت(?:ه|و|ها)(?!\p{L})|(?<!\p{L})(?:اي|باي|هي|هو) فيه(?!\p{L})|(?<!\p{L})فيه (?:هال|ال)منتج/u, english('category')],
  sku: [arabic('رمز|كود|باركود'), english('sku|barcode|product code')],
  categories: [arabic('فيات|تصنيفات|اقسام'), english('categories')],
  branches: [arabic('فروع|فروعكم|محلات|محلاتكم'), /(?<!\p{L})(?:وين|عنوان|اين|موقع)(?!\p{L}).*(?:فرع|محل)/u, english('branches|store locations?|branch locations?|where (?:is|are) (?:your |the )?(?:store|shop|branch)(?:es)?')],
  browse: [arabic('منتجات|منتجاتكم|بضاعه|بضايع|شو عندكم|شو في عندكم|شو بتبيعو|بتبيعو'), english('products|catalog|catalogue|items|what do you (?:sell|have)')],
  recommend: [arabic('اقترح|اقترحلي|اقتراح|انصح|انصحني|تنصحني|تنصحوني|بتنصح|بتنصحني|بتنصحوني|احسن|افضل'), english('recommend(?:ations?)?|suggest(?:ions?)?|best|top[ -]rated|highest[ -]rated')],
  cheapest: [arabic('ارخص|رخيص|رخيصه|اوفر|اقل سعر'), english('cheap(?:est)?|lowest price|affordable')],
  priciest: [arabic('اغلي|اعلي سعر'), english('most expensive|priciest|highest price')],
  compare: [arabic('قارن|قارنلي|مقارنه|تقارن|بقارن|الفرق بين|شو الفرق|احسن من|افضل من'), english('compare|comparison|vs|versus|difference between')],
  warranty: [arabic('ضمان|كفاله|مكفول'), english('warranty|guarantee')],
  returns: [arabic('ارجاع|ترجيع|استرجاع|استبدال|تبديل|ارجع|رجعه'), english('returns?|refunds?|exchange')],
  discount: [arabic('خصم|خصومات|حسم|تخفيض|تخفيضات|تنزيلات|عروض'), english('discounts?|sales?|offers?|coupons?')],
  delivery: [arabic('توصيل|شحن|تسليم|دليفري'), english('delivery|shipping|ship')],
  payment: [arabic('دفع|ادفع|تقسيط|اقساط|كاش'), english('payments?|pay|instal?lments?')],
  order: [arabic('طلبي|طلباتي|طلبيتي|طلبيه|اوردر'), english('my orders?|track(?:ing)? (?:my )?order|order status')],
  help: [arabic('ساعدني|مساعده|مين انت|شو بتعمل|شو بتقدر|شو فيك'), english('help|who are you|what can you do')],
  seek: [arabic('عندكم|عندك|بدي|فرجيني|ورجيني|بتبيعو|دورلي|دور علي'), english('do you have|do you sell|looking for|i want|i need|show me|find me')],
  alternatives: [arabic('غيره|متله|متلها|بداله|بديل|بدايل|مشابه|مشابهه'), english('similar|alternatives?|other options|something else')],
  whichBranch: [/(?<!\p{L})(?:باي|اي|وين|بوين)(?!\p{L})/u, arabic('فروع'), english('which branch(?:es)?|where|other branches|all branches')],
} satisfies Record<string, RegExp[]>;

export type Intent = keyof typeof PATTERNS;

export function detectIntents(normalized: string): Set<Intent> {
  const found = new Set<Intent>();
  for (const [intent, patterns] of Object.entries(PATTERNS) as Array<[Intent, RegExp[]]>) {
    if (patterns.some((pattern) => pattern.test(normalized))) found.add(intent);
  }
  // "اعلى المنتجات تقييماً" is a recommendation even without a verb.
  if (/اعلي/.test(normalized) && /تقييم/.test(normalized)) {
    found.add('recommend');
    found.delete('priciest');
  }
  // In "الفئات الموجودة" the adjective describes the list; it is not a stock question.
  if (found.has('categories') || found.has('branches')) {
    const withoutAdjectives = normalized.replace(/(?<!\p{L})ال(?:موجود|متوفر|متاح)ه?(?!\p{L})/gu, ' ');
    if (!PATTERNS.stock.some((pattern) => pattern.test(withoutAdjectives))) found.delete('stock');
  }
  return found;
}

export function priceBounds(normalized: string): { min?: number; max?: number } {
  const amount = '\\s*(?:من\\s+|ال\\s*)?(\\d+(?:\\.\\d+)?)';
  const max = normalized.match(new RegExp(`(?:تحت|اقل من|دون|ما بيتجاوز|لحد|بحدود|ميزانيتي|under|below|less than|cheaper than|up to)${amount}`));
  const min = normalized.match(new RegExp(`(?:فوق|اكتر من|اكثر من|اغلي من|over|above|more than)${amount}`));
  const range = normalized.match(/(?:between|بين)\s*(\d+(?:\.\d+)?)\s*(?:and|to|و|الي|ل)\s*(\d+(?:\.\d+)?)/);
  if (range) {
    const [low, high] = [Number(range[1]), Number(range[2])].sort((a, b) => a - b);
    return { min: low, max: high };
  }
  return { min: min ? Number(min[1]) : undefined, max: max ? Number(max[1]) : undefined };
}

const GREETINGS = /(?<!\p{L})(?:صباح الخير|صباح النور|مساء الخير|مساء النور|السلام عليكم(?: ورحمه الله(?: وبركاته)?)?|وعليكم السلام|مرحبا|مرحبتين|اهلا(?: وسهلا)?|اهلين|يا هلا|هلا|هاي|سلام|hello|hi|hey|good (?:morning|afternoon|evening))(?!\p{L})/gu;
const SMALL_TALK = /(?<!\p{L})(?:كيفك|كيفكن|كيف حالك|كيف الحال|شلونك|شو اخبارك|how are you|there)(?!\p{L})/gu;
const THANKS = /(?<!\p{L})(?:شكرا(?: كتير| جزيلا| الك| لك)?|يسلمو(?: ايديك)?|يعطيك العافيه|مشكور|مشكوره|thanks?(?: you)?(?: so much| a lot)?|thx)(?!\p{L})/gu;
const FILLER = /(?<!\p{L})(?:تمام|اوكي|طيب|كتير|اليوم|ok|okay|great|today)(?!\p{L})/gu;

/** Splits off greetings/thanks so "مرحبا، قديش سعره؟" is still answered as a question. */
export function splitCourtesy(normalized: string): { rest: string; greeted: boolean; thanked: boolean } {
  const greeted = normalized.search(GREETINGS) >= 0 || normalized.search(SMALL_TALK) >= 0;
  const thanked = normalized.search(THANKS) >= 0;
  const rest = normalized
    .replace(GREETINGS, ' ').replace(SMALL_TALK, ' ').replace(THANKS, ' ').replace(FILLER, ' ')
    .replace(/\s+/g, ' ').trim();
  return { rest, greeted, thanked };
}

const SYNONYMS: string[][] = [
  ['هاتف', 'هواتف', 'فون', 'موبايل', 'موبايلات', 'جوال', 'جوالات', 'تلفون', 'تلفونات', 'phone', 'phones', 'smartphone', 'smartphones'],
  ['لابتوب', 'لابتوبات', 'حاسوب', 'حواسيب', 'كمبيوتر', 'كمبيوترات', 'laptop', 'laptops', 'computer', 'computers'],
  ['ساعه', 'ساعات', 'watch', 'watches'],
  ['حقيبه', 'حقايب', 'شنطه', 'شنط', 'شنتات', 'bag', 'bags'],
  ['عطر', 'عطور', 'fragrance', 'fragrances', 'perfume', 'perfumes'],
  ['بقاله', 'اغذيه', 'مواد غذاييه', 'grocery', 'groceries', 'food'],
  ['ديكور', 'ديكورات', 'decor', 'decoration', 'decorations'],
  ['رياضه', 'رياضيه', 'sport', 'sports'],
  ['سماعه', 'سماعات', 'headphone', 'headphones', 'earbuds'],
  ['ملابس', 'البسه', 'تياب', 'clothes', 'clothing'],
  ['حذاء', 'احذيه', 'صبابيط', 'shoe', 'shoes'],
  ['اكسسوار', 'اكسسوارات', 'accessory', 'accessories'],
  ['الكترونيات', 'electronics'],
];

function containsWord(haystack: string, word: string): boolean {
  return new RegExp(`(?<!\\p{L})(?:و)?(?:هال|ب|ل|ع)?(?:ال|ل)?${word}(?!\\p{L})`, 'u').test(haystack);
}

/** The product type the shopper named (all of its synonyms), if any. */
export function requestedProductType(normalized: string): string[] | null {
  return SYNONYMS.find((group) => group.some((word) => containsWord(normalized, word))) ?? null;
}

export function matchCategories<T extends { name: string }>(normalized: string, categories: T[]): T[] {
  const group = requestedProductType(normalized);
  return categories.filter((category) => {
    const name = normalize(category.name);
    if (!name) return false;
    if (` ${normalized} `.includes(` ${name} `)) return true;
    const words = name.split(' ');
    return !!group && group.some((synonym) => words.includes(synonym));
  });
}

const GENERIC_NAME_WORDS = new Set([
  'the', 'and', 'for', 'with', 'set', 'new', 'pro', 'max', 'mini', 'plus', 'lite', 'smart', 'series',
  'phone', 'laptop', 'watch', 'bag', 'box', 'هاتف', 'جهاز', 'ساعه', 'حقيبه', 'عطر', 'لابتوب', 'منتج',
]);

/** "weak" means a single name word matched, which must not replace a selected product. */
export type NameMatch<T> = { exact: T[]; candidates: T[]; weak?: boolean };

/**
 * Finds products the shopper typed by name. Full names win; otherwise distinctive
 * name words are used, and more than one hit is reported as ambiguous.
 */
export function matchProductNames<T extends { name: string }>(normalized: string, products: T[]): NameMatch<T> {
  let remaining = ` ${normalized} `;
  const exact: Array<{ product: T; at: number }> = [];
  for (const product of [...products].sort((a, b) => b.name.length - a.name.length)) {
    const name = normalize(product.name);
    if (!name) continue;
    // Allow attached Arabic prefixes: "وPhone X", "لل..." are common when typing.
    const found = new RegExp(`(?<=\\s(?:و|ب|ل|ال)?)${name.replace(/\./g, '\\.')}(?=\\s)`, 'u').exec(remaining);
    if (!found) continue;
    exact.push({ product, at: found.index });
    remaining = remaining.slice(0, found.index) + '#'.repeat(found[0].length) + remaining.slice(found.index + found[0].length);
  }
  if (exact.length) {
    return { exact: exact.sort((a, b) => a.at - b.at).map((entry) => entry.product), candidates: [] };
  }

  const words = new Set(normalized.split(' '));
  const scored = products.map((product) => {
    const hits = normalize(product.name).split(' ').filter((word) => words.has(word));
    const distinctive = hits.some((word) => word.length >= 3 && !/^\d+$/.test(word) && !GENERIC_NAME_WORDS.has(word));
    return { product, score: distinctive || hits.length >= 2 ? hits.length : 0 };
  });
  const best = Math.max(0, ...scored.map((entry) => entry.score));
  const top = best ? scored.filter((entry) => entry.score === best).map((entry) => entry.product) : [];
  const weak = best === 1;
  if (top.length === 1) return { exact: top, candidates: [], weak };
  return { exact: [], candidates: top.slice(0, 5), weak };
}

/** Points at the product already in context: "بتنصحني فيه؟", "is it good?". */
export function refersToCurrent(normalized: string): boolean {
  return /(?<!\p{L})(?:فيه|منه|منها|منو|عنه|هاد|هادا|هاي|هالمنتج)(?!\p{L})|\b(?:it|this)\b/u.test(normalized);
}

const PRICE_FILLER = new Set([
  'قديش', 'اديش', 'اديه', 'قديه', 'كم', 'هو', 'هي', 'هاد', 'هادا', 'هاي', 'هالمنتج', 'المنتج', 'المحدد', 'يا', 'عندكم',
  'how', 'much', 'is', 'it', 'this', 'that', 'one', 'the', 'does', 'do', 'for', 'a', 'an',
]);

/**
 * "قديش؟" asks for the price, but "قديش وزنه؟" asks about something else: only
 * treat it as a price question when nothing but the product itself remains.
 */
export function isBarePriceQuestion(normalized: string, productName: string): boolean {
  const known = new Set(normalize(productName).split(' '));
  const type = requestedProductType(normalized) ?? [];
  return normalized.split(' ').every((word) => {
    const bare = word.replace(/^(?:ال|هال)/, '');
    return PRICE_FILLER.has(word) || known.has(word) || known.has(bare) || type.includes(bare);
  });
}

const PLACES: string[][] = [
  ['دمشق', 'الشام', 'damascus'], ['حمص', 'homs'], ['اللاذقيه', 'لاذقيه', 'latakia', 'lattakia'],
  ['حلب', 'aleppo'], ['طرطوس', 'tartus', 'tartous'], ['حماه', 'hama'],
];

/** Whether a branch is named in the question, in either language. */
export function mentionsBranch(normalized: string, branchName: string): boolean {
  const name = normalize(branchName);
  const aliases = PLACES.find((group) => group.some((alias) => name.split(' ').includes(alias))) ?? [];
  return [name, ...aliases].some((alias) => !!alias
    && new RegExp(`(?<!\\p{L})(?:و)?(?:ب|ل)?(?:ال)?${alias.replace(/\./g, '\\.')}(?!\\p{L})`, 'u').test(normalized));
}
