import { pipeline } from "@huggingface/transformers";
import type { StoreProduct } from "../types/cart";

const MODEL_ID = "Xenova/multilingual-e5-small";

type EmbeddingExtractor = Awaited<
  ReturnType<typeof pipeline<"feature-extraction">>
>;

let extractorPromise: Promise<EmbeddingExtractor> | null = null;

const productEmbeddingCache = new Map<string, number[]>();

function getExtractor(): Promise<EmbeddingExtractor> {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", MODEL_ID).catch(
      (error: unknown) => {
        extractorPromise = null;
        throw error;
      },
    );
  }

  return extractorPromise;
}

async function createEmbedding(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await extractor(text, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data as Float32Array);
}

function cosineSimilarity(left: number[], right: number[]): number {
  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    dotProduct += left[index] * right[index];
    leftMagnitude += left[index] * left[index];
    rightMagnitude += right[index] * right[index];
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) return 0;

  return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

function getProductText(product: StoreProduct): string {
  return `passage: ${product.title}. ${product.description}`.trim();
}

function getProductCacheKey(product: StoreProduct): string {
  return `${product.id}:${product.title}:${product.description}`;
}

async function getProductEmbedding(product: StoreProduct): Promise<number[]> {
  const cacheKey = getProductCacheKey(product);
  const cachedEmbedding = productEmbeddingCache.get(cacheKey);

  if (cachedEmbedding) return cachedEmbedding;

  const embedding = await createEmbedding(getProductText(product));
  productEmbeddingCache.set(cacheKey, embedding);

  return embedding;
}

export interface SemanticSearchResult {
  product: StoreProduct;
  score: number;
}

/**
 * Ranks products by cross-lingual semantic similarity.
 * Only title and description are embedded; category, brand and price are excluded.
 */
export async function searchProductsSemantically(
  query: string,
  products: StoreProduct[],
): Promise<SemanticSearchResult[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery || products.length === 0) return [];

  const queryEmbedding = await createEmbedding(`query: ${normalizedQuery}`);

  const results = await Promise.all(
    products.map(async (product) => {
      const productEmbedding = await getProductEmbedding(product);

      return {
        product,
        score: cosineSimilarity(queryEmbedding, productEmbedding),
      };
    }),
  );

  return results.sort((a, b) => b.score - a.score);
}
