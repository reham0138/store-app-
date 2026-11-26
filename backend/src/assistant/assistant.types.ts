import type { Language } from './assistant.text.js';

export type ProductCard = {
  id: string;
  name: string;
  price: number;
  thumbnail: string;
  rating: number;
  reviewCount: number;
  /** Stock at the selected branch; null when no branch is selected. */
  stock: number | null;
};

export type AssistantReply = {
  message: string;
  language: Language;
  products: ProductCard[];
  suggestedQuestions: string[];
  /** The single product this answer is about, so follow-up questions keep context. */
  focusProduct?: { id: string; name: string; thumbnail: string };
  needsProduct?: boolean;
  browseProducts?: boolean;
  /** True when the text came from the language model rather than store data. */
  aiGenerated?: boolean;
};
