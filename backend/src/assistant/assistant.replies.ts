/** All user-facing wording, so both languages stay side by side. */
import type { Intent, Language } from './assistant.text.js';

export function money(price: number): string {
  // Same format as the storefront (frontend/src/shared/utils/pricing.ts).
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

export function greetingFor(language: Language, timeZone?: string, now = new Date()): string {
  let hour = now.getHours();
  try {
    if (timeZone) {
      hour = Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone }).format(now));
    }
  } catch { /* invalid time zone: keep server time */ }
  const part = hour >= 5 && hour < 12 ? 0 : hour >= 12 && hour < 17 ? 1 : 2;
  return language === 'ar'
    ? ['صباح الخير', 'نهارك سعيد', 'مساء الخير'][part]
    : ['Good morning', 'Good afternoon', 'Good evening'][part];
}

export const TEXT = {
  ar: {
    intro: 'كيف فيني ساعدك؟ اسألني عن المنتجات والأسعار والتوفر والتقييمات والفروع.',
    thanks: 'على الرحب والسعة! إذا بدك أي معلومة تانية أنا هون.',
    help: 'فيني ساعدك بـ:\n- سعر أي منتج ووصفه وتقييمه\n- توفره بالفرع المختار وبباقي الفروع\n- المقارنة بين منتجين\n- عرض المنتجات حسب الفئة أو السعر أو التقييم\n- فئات المتجر وفروعه\nاكتب اسم المنتج بسؤالك، أو اختاره من زر «اختيار منتج».',
    scope: 'بعتذر، بقدر ساعدك بس بأمور المتجر: المنتجات وأسعارها وتوفرها وتقييماتها، والفئات والفروع.',
    needsProduct: 'عن أي منتج عم تسأل؟ اختاره من زر «اختيار منتج» أو اكتب اسمه بسؤالك.',
    notFound: 'ما لقيت هالمنتج ضمن بيانات المتجر حالياً. جرّب تختار منتج تاني.',
    ambiguous: 'لقيت أكتر من منتج قريب من طلبك. أي واحد بتقصد؟',
    needsTwo: 'للمقارنة لازمني منتجين. اكتب اسم المنتجين، مثلاً: «قارن بين … و …».',
    comparison: 'مقارنة من بيانات المتجر:',
    price: 'السعر',
    description: 'الوصف',
    noDescription: 'ما في وصف مسجل لهالمنتج.',
    rating: 'التقييم',
    noRating: 'ما في تقييمات لهالمنتج لسا.',
    reviews: 'مراجعة',
    latestReviews: 'من آراء الزبائن:',
    category: 'الفئة',
    noCategory: 'غير محددة',
    sku: 'رمز المنتج',
    inStock: (count: number, branch: string) => `متوفر بفرع ${branch}، الكمية: ${count}`,
    outOfStock: (branch: string) => `غير متوفر حالياً بفرع ${branch}.`,
    otherBranches: 'متوفر كمان بـ:',
    stockByBranch: 'التوفر حسب الفرع:',
    nowhere: 'غير متوفر حالياً بأي فرع.',
    pickBranch: 'اختار فرع من أعلى الصفحة لتشوف الكمية فيه.',
    categories: 'فئات المتجر:',
    noCategories: 'ما في فئات مسجلة حالياً.',
    branches: 'فروع المتجر:',
    noBranches: 'ما في فروع فعّالة مسجلة حالياً.',
    listAll: 'منتجات من المتجر:',
    listAvailable: (branch: string) => `منتجات متوفرة بفرع ${branch}:`,
    listTop: 'الأعلى تقييماً:',
    listCheapest: 'من الأرخص للأغلى:',
    listPriciest: 'من الأغلى للأرخص:',
    showing: (shown: number, total: number) => `عم أعرض ${shown} من أصل ${total}.`,
    noMatches: 'ما لقيت منتجات بتطابق طلبك حالياً.',
    noRated: 'ما في منتجات مقيّمة ضمن هالطلب لسا.',
    order: 'حالة طلباتك موجودة بصفحة «طلباتي» (Orders) بعد تسجيل الدخول. ما بقدر أوصل لتفاصيل الطلبات من المحادثة.',
    noSuchName: 'ما لقيت منتج بهالاسم. اكتب الاسم متل ما هو ظاهر بالمتجر، أو اختاره من زر «اختيار منتج».',
    alternatives: (name: string) => `خيارات من نفس فئة ${name}:`,
    unconfirmed: 'ما عندي معلومة مؤكدة بتجاوب على هالسؤال ضمن بيانات المتجر. هاد الوصف المسجل:',
  },
  en: {
    intro: 'How can I help? Ask me about products, prices, availability, ratings and branches.',
    thanks: "You're welcome! Ask me anytime.",
    help: 'I can help with:\n- Price, description and rating of any product\n- Stock at your selected branch and at other branches\n- Comparing two products\n- Browsing by category, price or rating\n- Store categories and branches\nType a product name in your question, or use the "Choose product" button.',
    scope: 'Sorry, I can only help with the store: products, prices, stock, ratings, categories and branches.',
    needsProduct: 'Which product do you mean? Use "Choose product" or type its name in your question.',
    notFound: "I couldn't find that product in the store data. Please choose another one.",
    ambiguous: 'I found more than one matching product. Which one do you mean?',
    needsTwo: 'I need two products to compare, for example: "compare … and …".',
    comparison: 'Comparison from store data:',
    price: 'Price',
    description: 'Description',
    noDescription: 'No description is recorded for this product.',
    rating: 'Rating',
    noRating: 'This product has no ratings yet.',
    reviews: 'reviews',
    latestReviews: 'What customers said:',
    category: 'Category',
    noCategory: 'Not set',
    sku: 'SKU',
    inStock: (count: number, branch: string) => `In stock at ${branch}: ${count}`,
    outOfStock: (branch: string) => `Currently out of stock at ${branch}.`,
    otherBranches: 'Also available at:',
    stockByBranch: 'Availability by branch:',
    nowhere: 'Currently out of stock at every branch.',
    pickBranch: 'Select a branch at the top of the page to see its quantity.',
    categories: 'Store categories:',
    noCategories: 'No categories are listed yet.',
    branches: 'Store branches:',
    noBranches: 'No active branches are listed.',
    listAll: 'Products from the store:',
    listAvailable: (branch: string) => `Products in stock at ${branch}:`,
    listTop: 'Top rated:',
    listCheapest: 'Cheapest first:',
    listPriciest: 'Most expensive first:',
    showing: (shown: number, total: number) => `Showing ${shown} of ${total}.`,
    noMatches: 'No products currently match your request.',
    noRated: 'None of the matching products have ratings yet.',
    order: 'You can check order status on the Orders page after signing in. I cannot access order details from chat.',
    noSuchName: 'I couldn\'t find a product by that name. Type it as it appears in the store, or use "Choose product".',
    alternatives: (name: string) => `Options from the same category as ${name}:`,
    unconfirmed: "The store data doesn't answer that question. Here is the recorded description:",
  },
} as const;

const POLICY: Partial<Record<Intent, Record<Language, string>>> = {
  warranty: { ar: 'ما عندي معلومات مؤكدة عن الضمان.', en: "I don't have confirmed warranty information." },
  returns: { ar: 'ما عندي معلومات مؤكدة عن الإرجاع أو الاستبدال.', en: "I don't have confirmed return or exchange information." },
  discount: { ar: 'ما عندي معلومات مؤكدة عن خصومات أو عروض.', en: "I don't have confirmed discount information." },
  delivery: { ar: 'ما عندي معلومات مؤكدة عن مدة التوصيل أو شروطه؛ رسوم التوصيل بتظهر بملخص السلة.', en: "I don't have confirmed delivery terms; any delivery fee is shown in the cart summary." },
  payment: { ar: 'ما عندي معلومات مؤكدة عن طرق الدفع؛ بتظهرلك خطوات الدفع عند إتمام الطلب.', en: "I don't have confirmed payment information; see the checkout page." },
};

export function policyNotes(intents: Set<Intent>, language: Language): string[] {
  return [...intents].flatMap((intent) => POLICY[intent]?.[language] ?? []);
}

export function generalQuestions(language: Language): string[] {
  return language === 'ar'
    ? ['شو المنتجات المتوفرة؟', 'شو أعلى المنتجات تقييماً؟', 'شو الفئات الموجودة؟', 'وين فروع المتجر؟']
    : ['What products are available?', 'What are the top rated products?', 'What categories do you have?', 'Where are your branches?'];
}

export function productQuestions(language: Language, answered: Set<Intent>): string[] {
  const all: Array<[Intent, string, string]> = [
    ['price', 'شو سعره؟', 'What is its price?'],
    ['stock', 'بأي فرع متوفر؟', 'Which branches have it in stock?'],
    ['description', 'شو مواصفاته؟', 'What are its specifications?'],
    ['rating', 'شو تقييمه؟', 'What is its rating?'],
  ];
  return all.filter(([intent]) => !answered.has(intent)).map(([, ar, en]) => (language === 'ar' ? ar : en));
}
