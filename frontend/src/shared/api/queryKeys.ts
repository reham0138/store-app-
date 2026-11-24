export const queryKeys = {
  auth: {
    session: ["auth", "session"] as const,
  },
  branches: {
    all: ["branches"] as const,
  },
  staff: {
    all: ["staff"] as const,
  },
  products: {
    all: ["products"] as const,
    lists: () => [...queryKeys.products.all, "list"] as const,
    list: (query: unknown) => [...queryKeys.products.lists(), query] as const,
    detail: (id: string, branchId?: string) =>
      [...queryKeys.products.all, "detail", id, branchId] as const,
  },
  orders: {
    all: ["orders"] as const,
    lists: () => [...queryKeys.orders.all, "list"] as const,
    list: (query: unknown) => [...queryKeys.orders.lists(), query] as const,
    detail: (id: string) => [...queryKeys.orders.all, "detail", id] as const,
  },
  reviews: {
    all: ["reviews"] as const,
    list: (productId: string, page: number, limit: number) =>
      [...queryKeys.reviews.all, productId, page, limit] as const,
  },
  reports: {
    all: ["reports"] as const,
    admin: (branchId?: string) =>
      [...queryKeys.reports.all, "admin", branchId] as const,
    branch: ["reports", "branch"] as const,
  },
} as const;
