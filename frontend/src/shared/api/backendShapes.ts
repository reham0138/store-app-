export interface BackendPage<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  };
}

export function readId(value: { id?: unknown; _id?: unknown }): string {
  const id = value.id ?? value._id;
  if (typeof id !== "string" && typeof id !== "number") {
    throw new Error("The backend returned an entity without a valid id.");
  }
  return String(id);
}

export function normalizePage<T>(
  value: BackendPage<T> | { items: T[]; total: number; page: number; limit: number },
) {
  if ("items" in value && Array.isArray(value.items)) {
    return value;
  }
  if (
    "data" in value &&
    Array.isArray(value.data) &&
    typeof value.meta?.total === "number"
  ) {
    return {
      items: value.data,
      total: value.meta.total,
      page: value.meta.page,
      limit: value.meta.limit,
    };
  }
  throw new Error("The backend returned an invalid paginated response.");
}
