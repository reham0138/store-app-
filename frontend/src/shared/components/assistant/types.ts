export type Language = "ar" | "en";

export type ProductRef = { id: string; name: string; thumbnail?: string };

export type AssistantProduct = {
  id: string;
  name: string;
  price: number;
  thumbnail: string;
  rating: number;
  reviewCount: number;
  stock: number | null;
};

/** Mirrors backend/src/assistant/assistant.types.ts */
export type AssistantReply = {
  message: string;
  language: Language;
  products: AssistantProduct[];
  suggestedQuestions: string[];
  focusProduct?: ProductRef;
  needsProduct?: boolean;
  browseProducts?: boolean;
  aiGenerated?: boolean;
};

export type AssistantRequest = {
  message: string;
  productId?: string;
  selectedProductName?: string;
  branchId?: string;
  timeZone?: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
};

export type ChatMessage = {
  id: number;
  time: Date;
  language: Language;
  content: string;
} & (
  | { role: "user"; productName?: string }
  | { role: "assistant"; reply?: AssistantReply; failedRequest?: AssistantRequest }
);
