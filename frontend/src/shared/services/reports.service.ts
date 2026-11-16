import type { Order, OrderStatus } from "../types/order";
import type { StoreProduct } from "../types/cart";
import { apiClient, USE_MOCK, ApiError, normalizeError } from "../api/index.ts";
import { ordersService } from "./orders.service";
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
  return { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
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
        title: item.title,
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

async function apiReport(path: string): Promise<DashboardReport> {
  try {
    const { data } = await apiClient.get<DashboardReport>(path);
    return data;
  } catch (error) {
    const normalized = normalizeError(error, "Failed to load report.");
    throw new ApiError(normalized.message, normalized.code, normalized.status);
  }
}

export const reportsService = {
  /** Admin store-wide report. Optional branchId scopes the whole report. */
  admin(branchId?: string): Promise<DashboardReport> {
    if (USE_MOCK) return mockAdminReport(branchId);
    const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : "";
    return apiReport(`/reports/summary${query}`);
  },
  /** Branch-manager report scoped to the JWT branch (manager never sends branchId). */
  branch(): Promise<DashboardReport> {
    return USE_MOCK ? mockBranchReport() : apiReport("/reports/branch");
  },
};
