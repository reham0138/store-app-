import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generalQuestions, greetingFor, productQuestions } from './assistant.replies.js';
import { AssistantService } from './assistant.service.js';
import { matchProductNames } from './assistant.text.js';
import type { AssistantChatDto } from './assistant.dto.js';

const id = (n: number) => n.toString(16).padStart(24, '0');
const LATAKIA = id(101);
const DAMASCUS = id(102);

const categories = [{ _id: id(201), name: 'smartphones' }, { _id: id(202), name: 'laptops' }];
const branches = [
  { _id: DAMASCUS, name: 'Damascus', address: 'Damascus, Syria' },
  { _id: LATAKIA, name: 'Latakia', address: 'Latakia, Syria' },
];
const product = (n: number, name: string, price: number, categoryId: string, rating = 0, reviewCount = 0) => ({
  _id: id(n), name, sku: `SKU-${n}`, description: `${name} description`, thumbnail: '', images: [],
  price, categoryId, rating, reviewCount,
});
const products = [
  product(1, 'Phone X Pro', 699, id(201), 4.5, 2),
  product(2, 'Budget Phone Lite', 179, id(201)),
  product(3, 'UltraSlim 14', 1099, id(202), 4.8, 5),
  product(4, 'Student Laptop 15', 549, id(202), 3.9, 1),
  product(5, 'Gaming Laptop Raptor', 1499, id(202)),
];
const inventory = [
  { productId: id(1), branchId: LATAKIA, stock: 3 },
  { productId: id(3), branchId: DAMASCUS, stock: 4 },
  { productId: id(4), branchId: LATAKIA, stock: 7 },
];

const chain = (value: unknown) => {
  const query = { select: () => query, sort: () => query, limit: () => query, lean: async () => value };
  return query;
};

function createService() {
  return new AssistantService(
    { find: () => chain(products) } as never,
    {
      find: (filter: any) => chain(inventory.filter((row) =>
        filter.productId.$in.map(String).includes(row.productId)
        && filter.branchId.$in.map(String).includes(row.branchId))),
    } as never,
    { find: () => chain(categories) } as never,
    {
      find: () => chain(branches),
      findOne: (filter: any) => chain(branches.find((branch) => branch._id === filter._id) ?? null),
    } as never,
    { find: () => chain([{ rating: 5, comment: 'Excellent' }]) } as never,
  );
}

describe('AssistantService', () => {
  let service: AssistantService;
  const modelCall = vi.fn();

  beforeEach(() => {
    modelCall.mockReset().mockRejectedValue(new Error('ECONNREFUSED'));
    vi.stubGlobal('fetch', modelCall);
    service = createService();
    (service as any).logger = { warn: vi.fn(), error: vi.fn() };
  });
  afterEach(() => vi.unstubAllGlobals());

  const ask = (message: string, extra: Partial<AssistantChatDto> = {}) =>
    service.chat({ message, branchId: LATAKIA, ...extra });
  const names = (reply: Awaited<ReturnType<typeof ask>>) => reply.products.map((item) => item.name);
  const selected = { productId: id(1), selectedProductName: 'Phone X Pro' };

  describe('general store questions need no selected product', () => {
    it('lists in-stock products of the selected branch', async () => {
      const reply = await ask('شو المنتجات المتوفرة؟');
      expect(names(reply).sort()).toEqual(['Phone X Pro', 'Student Laptop 15']);
      expect(reply.needsProduct).toBeUndefined();
    });

    it.each(['شو الفئات الموجودة بالمتجر؟', 'what categories do you have?', 'شو الأقسام؟'])('lists categories: %s', async (q) => {
      expect((await ask(q)).message).toContain('- laptops');
    });

    it.each(['وين فروع المتجر؟', 'وين فروعكم', 'where are your branches?'])('lists branches: %s', async (q) => {
      expect((await ask(q)).message).toContain('Latakia, Syria');
    });

    it.each(['اقترح علي منتجات الأعلى تقييماً', 'شو أعلى المنتجات تقييماً؟', 'What are the top rated products?'])('ranks by rating: %s', async (q) => {
      expect(names(await ask(q))).toEqual(['UltraSlim 14', 'Phone X Pro', 'Student Laptop 15']);
    });

    it('filters by Arabic product type', async () => {
      expect(names(await ask('عندكم لابتوبات؟')).sort()).toEqual(['Gaming Laptop Raptor', 'Student Laptop 15', 'UltraSlim 14']);
    });

    it('filters by price, including Arabic digits', async () => {
      expect(names(await ask('بدي لابتوب تحت ٦٠٠'))).toEqual(['Student Laptop 15']);
    });

    it('sorts by price', async () => {
      expect(names(await ask('شو أرخص موبايل عندكم؟'))[0]).toBe('Budget Phone Lite');
      expect(names(await ask('what is the most expensive laptop?'))[0]).toBe('Gaming Laptop Raptor');
    });

    it('does not show unrelated products for a type the store lacks', async () => {
      const reply = await ask('عندكم سماعات؟');
      expect(reply.products).toEqual([]);
      expect(reply.message).toContain('ما لقيت');
    });
  });

  describe('questions about a specific product', () => {
    it.each(['شو سعره؟', 'قديش حقه؟', 'بكم هاد؟', 'قديش؟', 'سعر هالمنتج'])('answers the price from data: %s', async (q) => {
      const reply = await ask(q, selected);
      expect(reply.message).toContain('$699.00');
      expect(reply.message).not.toContain('description');
      expect(modelCall).not.toHaveBeenCalled();
    });

    it.each(['what is the price?', 'how much is it?'])('replies in English: %s', async (q) => {
      const reply = await ask(q, selected);
      expect(reply.language).toBe('en');
      expect(reply.message).toContain('Price: $699.00');
    });

    it('finds a product typed by name, without any selection', async () => {
      const reply = await ask('قديش سعر UltraSlim 14؟');
      expect(reply.language).toBe('ar');
      expect(reply.message).toContain('$1,099.00');
      expect(reply.focusProduct?.name).toBe('UltraSlim 14');
    });

    it('prefers the typed product over the selected one', async () => {
      expect((await ask('price of student laptop 15', selected)).message).toContain('$549.00');
    });

    it('answers only the requested fields', async () => {
      const reply = await ask('شو سعر ومخزون المنتج المحدد؟', selected);
      expect(reply.message).toContain('$699.00');
      expect(reply.message).toContain('الكمية: 3');
      expect(reply.message).not.toContain('الوصف');
    });

    it('treats a missing inventory record as zero and suggests other branches', async () => {
      const reply = await ask('هل UltraSlim 14 متوفر؟');
      expect(reply.message).toContain('غير متوفر حالياً بفرع Latakia');
      expect(reply.message).toContain('- Damascus: 4');
    });

    it('uses a branch typed in the question', async () => {
      expect((await ask('is UltraSlim 14 in stock in Damascus?')).message).toContain('In stock at Damascus: 4');
    });

    it('lists every branch when asked which branch', async () => {
      const reply = await ask('بأي فرع متوفر؟', selected);
      expect(reply.message).toContain('- Damascus: 0');
      expect(reply.message).toContain('- Latakia: 3');
    });

    it('includes review comments', async () => {
      expect((await ask('شو تقييمه؟', selected)).message).toContain('Excellent');
    });

    it('gives full details for a bare name', async () => {
      const reply = await ask('احكيلي عن Phone X Pro');
      expect(reply.message).toContain('Phone X Pro description');
      expect(reply.message).toContain('$699.00');
    });

    it('offers choices when only the product type is named', async () => {
      const reply = await ask('قديش سعر اللابتوب؟');
      expect(reply.needsProduct).toBe(true);
      expect(names(reply)).toHaveLength(3);
    });

    it('reports ambiguous partial names', () => {
      const match = matchProductNames('price of gaming', [{ name: 'Gaming Phone G1' }, { name: 'Gaming Laptop Raptor' }]);
      expect(match.candidates).toHaveLength(2);
    });

    it('asks for a product when none is known', async () => {
      expect((await ask('شو سعره؟')).needsProduct).toBe(true);
    });

    it('reports an unknown selected product without guessing', async () => {
      const reply = await ask('شو سعره؟', { selectedProductName: 'Old Mock Item' });
      expect(reply.message).toContain('ما لقيت هالمنتج');
    });

    it('compares two named products', async () => {
      const reply = await ask('قارن بين UltraSlim 14 و Student Laptop 15');
      expect(names(reply)).toEqual(['UltraSlim 14', 'Student Laptop 15']);
    });

    it('compares the selected product with a named one', async () => {
      expect(names(await ask('compare it with UltraSlim 14', selected))).toEqual(['Phone X Pro', 'UltraSlim 14']);
    });

    it('never invents policies', async () => {
      const reply = await ask('في ضمان عليه؟', selected);
      expect(reply.message).toContain('ما عندي معلومات مؤكدة عن الضمان');
      expect(modelCall).not.toHaveBeenCalled();
    });
  });

  describe('colloquial phrasing', () => {
    it.each(['لسا في منه؟', 'في منو باللاذقية؟', 'where can I find it?'])('reads as a stock question: %s', async (q) => {
      expect((await ask(q, selected)).message).toMatch(/Latakia.*3/);
    });

    it('understands Arabic branch names', async () => {
      expect((await ask('UltraSlim 14 موجود بفرع دمشق؟')).message).toContain('متوفر بفرع Damascus');
    });

    it('matches a partial name with a short model letter', async () => {
      expect((await ask('قديش الفون x pro')).message).toContain('$699.00');
    });

    it.each(['وزنه قديش؟', 'how much storage does it have?'])('does not answer another attribute with the price: %s', async (q) => {
      expect((await ask(q, selected)).message).not.toContain('$699.00');
    });

    it('reads "شو هي فئة هالمنتج" as the category of the product', async () => {
      expect((await ask('شو هي فئة هالمنتج', selected)).message).toContain('smartphones');
    });

    it('answers "would you recommend it" about the selected product', async () => {
      expect(names(await ask('هل بتنصحني فيه؟', selected))).toEqual(['Phone X Pro']);
    });

    it('offers cheaper alternatives from the same category', async () => {
      expect(names(await ask('شو الأرخص منه؟', selected))).toEqual(['Budget Phone Lite']);
    });

    it('filters a price range', async () => {
      expect(names(await ask('products between 500 and 700')).sort()).toEqual(['Phone X Pro', 'Student Laptop 15']);
    });

    it.each(['is it good for gaming?', 'is it good for a student?'])('keeps the selected product when one word matches another name: %s', async (q) => {
      expect(names(await ask(q, selected))).toEqual(['Phone X Pro']);
    });

    it('says so when no product matches the name', async () => {
      expect((await ask('عندكم زيت؟')).message).toContain('ما لقيت منتج بهالاسم');
    });

    it.each(['يسلمو كتير', 'تمام شكرا'])('accepts thanks: %s', async (q) => {
      expect((await ask(q, selected)).message).toContain('على الرحب');
    });
  });

  describe('courtesy and fallbacks', () => {
    it.each(['مرحبا', 'مرحبا، كيفك؟', 'السلام عليكم ورحمة الله', 'hi there'])('greets: %s', async (q) => {
      const reply = await ask(q, selected);
      expect(reply.products).toEqual([]);
      expect(modelCall).not.toHaveBeenCalled();
    });

    it('answers a question that starts with a greeting', async () => {
      expect((await ask('مرحبا، قديش سعره؟', selected)).message).toContain('$699.00');
    });

    it('stays available when the language model is down', async () => {
      const reply = await ask('بينفع للألعاب؟', selected);
      expect(reply.message).toContain('Phone X Pro description');
      expect(reply.aiGenerated).toBeUndefined();
    });

    it('uses the model for free-form product questions', async () => {
      modelCall.mockResolvedValue({ ok: true, json: async () => ({ message: { content: 'بيانات المتجر ما بتذكر هالشي.' } }) });
      expect((await ask('بينفع للألعاب؟', selected)).aiGenerated).toBe(true);
    });

    it('rejects a model answer in the wrong language', async () => {
      modelCall.mockResolvedValue({ ok: true, json: async () => ({ message: { content: 'Sure, it is great.' } }) });
      expect((await ask('بينفع للألعاب؟', selected)).aiGenerated).toBeUndefined();
    });

    it('declines unrelated topics', async () => {
      expect((await ask('مين ربح بالمباراة؟')).message).toContain('بعتذر');
      expect(modelCall).not.toHaveBeenCalled();
    });
  });

  it.each(['ar', 'en'] as const)('answers every suggested question it offers (%s)', async (language) => {
    for (const question of [...generalQuestions(language), ...productQuestions(language, new Set())]) {
      const reply = await ask(question, selected);
      expect(reply.language, question).toBe(language);
      expect(reply.needsProduct, question).toBeUndefined();
    }
    expect(modelCall).not.toHaveBeenCalled();
  });

  it.each([[2, 'مساء الخير'], [9, 'صباح الخير'], [14, 'نهارك سعيد'], [20, 'مساء الخير']])('greets correctly at %i:00', (hour, expected) => {
    expect(greetingFor('ar', 'UTC', new Date(Date.UTC(2026, 0, 1, hour)))).toBe(expected);
  });
});
