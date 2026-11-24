import type { Order, OrderStatus } from "../types/order";
import type { StoreProduct } from "../types/cart";
import { apiClient, USE_MOCK, ApiError, normalizeError } from "../api/index.ts";
import { ordersService } from "./orders.service";
import { mapBackendOrder } from "./orders.service";
import { getProducts } from "./product.service";
import { getBranches } from "./branches.service";
import { authService } from "./authService";

/** Contract §6: GET /reports/summary | /reports/branch response shape. */
export interface ReportLowStockProduct {
  productId: string;
  title: string;
  branchId: string;
  stock: number;
}

export interface ReportTopProduct {
  productId: string;
  title: string;
  quantitySold: number;
}

export interface ReportSalesDay {
  date: string; // YYYY-MM-DD
  orders: number;
  revenue: number;
}

export interface ReportSalesCategory {
  category: string;
  quantitySold: number;
  revenue: number;
}

export interface ReportBranchSales {
  branchId: string;
  totalOrders: number;
  revenue: number;
}

export interface DashboardReport {
  /** ALL orders in scope, including cancelled (v2.3 §6). */
  totalOrders: number;
  /** Sum of order totals with status != "cancelled". */
  revenue: number;
  /** revenue / number of non-cancelled orders (0 if none). */
  averageOrderValue: number;
  /** Count of branch/product stock pairs at 0. */
  outOfStockCount: number;
  ordersByStatus: Record<OrderStatus, number>;
  /** stock <= 5 (includes 0), lowest stock first, max 20 items. */
  lowStockProducts: ReportLowStockProduct[];
  topProducts: ReportTopProduct[];
  /** Last 30 days. */
  salesByDay: ReportSalesDay[];
  salesByCategory: ReportSalesCategory[];
  /** Last 5 orders, newest first. */
  recentOrders: Order[];
  /** Present only on /reports/branch (v2.3 §6). */
  branch?: { id: string; name: string };
  /** Present only on /reports/summary without ?branchId=. */
  byBranch?: ReportBranchSales[];
}

const LOW_STOCK_MAX = 5;
const LOW_STOCK_LIMIT = 20;
const SALES_DAYS = 30;
const TOP_PRODUCTS_LIMIT = 5;
const RECENT_ORDERS_LIMIT = 5;

function emptyStatusCounts(): Record<OrderStatus, number> {
  return { pending: 0, processing: 0, paid: 0, shipped: 0, delivered: 0, cancelled: 0 };
}

function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface StockPair {
  productId: string;
  title: string;
  branchId: string;
  stock: number;
}

function stockPairs(products: StoreProduct[], branchId?: string): StockPair[] {
  const pairs: StockPair[] = [];
  for (const product of products) {
    for (const inv of product.branchInventory ?? []) {
      if (branchId && inv.branchId !== branchId) continue;
      pairs.push({
        productId: product.id,
        title: product.title,
        branchId: inv.branchId,
        stock: inv.stock,
      });
    }
  }
  return pairs;
}

function buildReport(
  orders: Order[],
  products: StoreProduct[],
  branchId?: string,
  includeByBranch = false,
): DashboardReport {
  const scopedOrders = branchId
    ? orders.filter((order) => (order.branchId ?? order.branch?.id) === branchId)
    : orders;
  const activeOrders = scopedOrders.filter((order) => order.status !== "cancelled");

  const revenue = activeOrders.reduce((sum, order) => sum + order.total, 0);
  const averageOrderValue = activeOrders.length ? revenue / activeOrders.length : 0;

  const ordersByStatus = emptyStatusCounts();
  for (const order of scopedOrders) {
    ordersByStatus[order.status] += 1;
  }

  const pairs = stockPairs(products, branchId);
  const outOfStockCount = pairs.filter((p) => p.stock <= 0).length;
  const lowStockProducts = pairs
    .filter((p) => p.stock <= LOW_STOCK_MAX)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, LOW_STOCK_LIMIT);

  // Top products by units sold across non-cancelled orders.
  const soldByProduct = new Map<string, { title: string; quantitySold: number }>();
  for (const order of activeOrders) {
    for (const item of order.items) {
      const entry = soldByProduct.get(item.productId) ?? {
        title: item.title ?? "Product",
        quantitySold: 0,
      };
      entry.quantitySold += item.quantity;
      soldByProduct.set(item.productId, entry);
    }
  }
  const topProducts: ReportTopProduct[] = [...soldByProduct.entries()]
    .map(([productId, v]) => ({ productId, title: v.title, quantitySold: v.quantitySold }))
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, TOP_PRODUCTS_LIMIT);

  // Sales per day, last 30 days (non-cancelled).
  const dayMap = new Map<string, { orders: number; revenue: number }>();
  const today = new Date();
  for (let i = SALES_DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dayMap.set(dayKey(d), { orders: 0, revenue: 0 });
  }
  for (const order of activeOrders) {
    const key = dayKey(new Date(order.createdAt));
    const entry = dayMap.get(key);
    if (entry) {
      entry.orders += 1;
      entry.revenue += order.total;
    }
  }
  const salesByDay: ReportSalesDay[] = [...dayMap.entries()].map(([date, v]) => ({
    date,
    orders: v.orders,
    revenue: v.revenue,
  }));

  // Sales by category (non-cancelled), sorted by revenue desc.
  const catMap = new Map<string, { quantitySold: number; revenue: number }>();
  for (const order of activeOrders) {
    for (const item of order.items) {
      const category = item.category ?? "Uncategorized";
      const entry = catMap.get(category) ?? { quantitySold: 0, revenue: 0 };
      entry.quantitySold += item.quantity;
      entry.revenue += item.unitPrice * item.quantity;
      catMap.set(category, entry);
    }
  }
  const salesByCategory: ReportSalesCategory[] = [...catMap.entries()]
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.revenue - a.revenue);

  const recentOrders = [...scopedOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, RECENT_ORDERS_LIMIT);

  const report: DashboardReport = {
    totalOrders: scopedOrders.length,
    revenue,
    averageOrderValue,
    outOfStockCount,
    ordersByStatus,
    lowStockProducts,
    topProducts,
    salesByDay,
    salesByCategory,
    recentOrders,
  };

  if (includeByBranch) {
    const branchIds = [...new Set(orders.map((o) => o.branchId ?? o.branch?.id).filter(Boolean))] as string[];
    report.byBranch = branchIds.map((id) => {
      const branchOrders = orders.filter((o) => (o.branchId ?? o.branch?.id) === id);
      const branchActive = branchOrders.filter((o) => o.status !== "cancelled");
      return {
        branchId: id,
        totalOrders: branchOrders.length,
        revenue: branchActive.reduce((sum, o) => sum + o.total, 0),
      };
    });
  }

  return report;
}

async function mockReport(
  branchId?: string,
  includeByBranch = false,
  includeBranchInfo = false,
): Promise<DashboardReport> {
  const [ordersResult, products, branches] = await Promise.all([
    ordersService.list({ page: 1, limit: 10000 }),
    getProducts(),
    getBranches(),
  ]);
  const report = buildReport(ordersResult.items, products, branchId, includeByBranch);
  if (includeBranchInfo && branchId) {
    const branch = branches.find((b) => b.id === branchId);
    if (branch) report.branch = { id: branch.id, name: branch.name };
  }
  return report;
}

async function mockAdminReport(branchId?: string): Promise<DashboardReport> {
  return mockReport(branchId, !branchId);
}

async function mockBranchReport(): Promise<DashboardReport> {
  const branchId = authService.getCurrentUser()?.branchId;
  // A manager without an assigned branch sees an empty report, not all orders.
  return mockReport(branchId ?? "__unassigned__", false, true);
}

function relationId(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null) {
    const record = value as { id?: unknown; _id?: unknown };
    const id = record.id ?? record._id;
    if (typeof id === "string") return id;
  }
  throw new Error("The reports API returned an invalid entity ID.");
}

function requireArray<T>(value: unknown, endpoint: string): T[] {
  if (!Array.isArray(value)) {
    throw new Error(`The ${endpoint} report returned an invalid response.`);
  }
  return value as T[];
}

interface BackendOverview {
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: Record<string, number>;
}

async function fetchBackendReport(branchId?: string): Promise<DashboardReport> {
  const params = branchId ? { branchId } : undefined;
  try {
    const [
      overviewResponse,
      lowStockResponse,
      topProductsResponse,
      salesByDayResponse,
      salesByCategoryResponse,
      recentOrdersResponse,
    ] = await Promise.all([
      apiClient.get<BackendOverview>("/reports/overview", { params }),
      apiClient.get<unknown>("/reports/low-stock", { params }),
      apiClient.get<unknown>("/reports/top-selling", { params }),
      apiClient.get<unknown>("/reports/daily-sales", { params }),
      apiClient.get<unknown>("/reports/sales-by-category", { params }),
      apiClient.get<unknown>("/reports/recent-orders", { params }),
    ]);

    const overview = overviewResponse.data;
    const statusCounts = emptyStatusCounts();
    for (const [status, count] of Object.entries(overview.ordersByStatus ?? {})) {
      if (status in statusCounts && typeof count === "number") {
        statusCounts[status as OrderStatus] = count;
      }
    }

    const lowStockRows = requireArray<{
      productId: string | { _id?: string; id?: string; name?: string };
      branchId: string | { _id?: string; id?: string };
      stock: number;
    }>(lowStockResponse.data, "low-stock")
      .map((item) => ({
        productId: relationId(item.productId),
        title: typeof item.productId === "object" ? item.productId.name ?? "Product" : "Product",
        branchId: relationId(item.branchId),
        stock: item.stock,
      }))
      .filter((item) => item.stock <= LOW_STOCK_MAX);
    const lowStockProducts = lowStockRows.slice(0, LOW_STOCK_LIMIT);

    const topProducts = requireArray<{
      _id: string;
      name: string;
      totalQuantity: number;
    }>(topProductsResponse.data, "top-selling")
      .map((item) => ({
        productId: item._id,
        title: item.name,
        quantitySold: item.totalQuantity,
      }))
      .slice(0, TOP_PRODUCTS_LIMIT);

    const salesByDay = requireArray<{
      _id: string;
      totalOrders: number;
      totalRevenue: number;
    }>(salesByDayResponse.data, "daily-sales")
      .map((item) => ({
        date: item._id,
        orders: item.totalOrders,
        revenue: item.totalRevenue,
      }))
      .slice(-SALES_DAYS);

    const salesByCategory = requireArray<{
      categoryName: string;
      totalQuantity: number;
      totalRevenue: number;
    }>(salesByCategoryResponse.data, "sales-by-category")
      .map((item) => ({
        category: item.categoryName,
        quantitySold: item.totalQuantity,
        revenue: item.totalRevenue,
      }));

    const recentOrders = requireArray<Parameters<typeof mapBackendOrder>[0]>(
      recentOrdersResponse.data,
      "recent-orders",
    ).map(mapBackendOrder);
    const completedOrders =
      statusCounts.paid + statusCounts.shipped + statusCounts.delivered;
    const revenue = overview.totalRevenue;

    return {
      totalOrders: overview.totalOrders,
      revenue,
      averageOrderValue: completedOrders > 0 ? revenue / completedOrders : 0,
      outOfStockCount: lowStockRows.filter((product) => product.stock <= 0).length,
      ordersByStatus: statusCounts,
      lowStockProducts,
      topProducts,
      salesByDay,
      salesByCategory,
      recentOrders,
      ...(branchId
        ? {
            branch: {
              id: branchId,
              name: "Branch",
            },
          }
        : {}),
    };
  } catch (error) {
    const normalized = normalizeError(error, "Failed to load report.");
    throw new ApiError(normalized.message, normalized.code, normalized.status);
  }
}

export const reportsService = {
  /** Admin store-wide report. Optional branchId scopes the whole report. */
  admin(branchId?: string): Promise<DashboardReport> {
    if (USE_MOCK) return mockAdminReport(branchId);
    return fetchBackendReport(branchId);
  },
  /** Branch-manager report scoped to the JWT branch (manager never sends branchId). */
  branch(): Promise<DashboardReport> {
    if (USE_MOCK) return mockBranchReport();
    return fetchBackendReport().then(async (report) => {
      const branchId = authService.getCurrentUser()?.branchId;
      if (!branchId) {
        throw new ApiError(
          "The signed-in branch manager has no assigned branch.",
          "FORBIDDEN",
          403,
        );
      }
      const branches = await getBranches();
      const branch = branches.find((item) => item.id === branchId);
      if (!branch) {
        throw new ApiError("The assigned branch was not returned by the backend.", "NOT_FOUND", 404);
      }
      report.branch = { id: branch.id, name: branch.name };
      return report;
    });
  },
};
