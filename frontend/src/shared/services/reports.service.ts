import type { Order } from "../types/order";
import type { StoreProduct } from "../types/cart";
import type { Branch } from "../types/type";
import { apiClient, USE_MOCK, ApiError, normalizeError } from "../api/index.ts";
import { ordersService } from "./orders.service";
import { getProducts } from "./product.service";
import { getBranches } from "./branches.service";
import { authService } from "./authService";
import {
  getRevenueByDay,
  getOrderStatusCounts,
  getTopProducts,
  getInventoryStockLevels,
  type DashboardMetric,
} from "../utils/dashboardMetrics";
import { getStockStatus } from "./inventory.service";

export interface BranchSalesRow {
  branchId: string;
  branchName: string;
  revenue: number;
  orderCount: number;
  activity: "Active" | "No recent sales";
}

export interface DashboardReport {
  orders: Order[];
  products: StoreProduct[];
  branches: Branch[];
  revenueByDay: DashboardMetric[];
  orderStatusCounts: { status: string; count: number }[];
  topProducts: DashboardMetric[];
  stockLevels: DashboardMetric[];
  recentOrders: Order[];
  stockAlerts: StoreProduct[];
  totals: {
    totalOrders: number;
    pendingOrders: number;
    orderRevenue: number;
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
  };
  branchSales: BranchSalesRow[];
}

function buildReport(
  orders: Order[],
  products: StoreProduct[],
  branches: Branch[],
  branchId?: string,
): DashboardReport {
  const scopedOrders = branchId
    ? orders.filter((order) => order.branch?.id === branchId)
    : orders;
  const scopedProducts = branchId
    ? products.map((product) => ({
        ...product,
        stock:
          product.branchInventory?.find((i) => i.branchId === branchId)?.stock ?? 0,
      }))
    : products;

  const activeOrders = scopedOrders.filter((order) => order.status !== "cancelled");
  const orderRevenue = activeOrders.reduce((sum, order) => sum + order.total, 0);

  const recentOrders = [...scopedOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const stockAlerts = [...scopedProducts]
    .filter((product) => product.stock <= 10)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

  const branchSales = branches.map((branch) => {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 29);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    const branchOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt).getTime();
      return (
        order.branch?.id === branch.id &&
        order.status !== "cancelled" &&
        orderDate >= startDate.getTime() &&
        orderDate < endDate.getTime()
      );
    });

    return {
      branchId: branch.id,
      branchName: branch.name,
      revenue: branchOrders.reduce((total, order) => total + order.total, 0),
      orderCount: branchOrders.length,
      activity: (branchOrders.length > 0 ? "Active" : "No recent sales") as
        | "Active"
        | "No recent sales",
    };
  });

  return {
    orders: scopedOrders,
    products: scopedProducts,
    branches,
    revenueByDay: getRevenueByDay(scopedOrders),
    orderStatusCounts: getOrderStatusCounts(scopedOrders),
    topProducts: getTopProducts(scopedOrders),
    stockLevels: getInventoryStockLevels(scopedProducts, branchId),
    recentOrders,
    stockAlerts,
    totals: {
      totalOrders: scopedOrders.length,
      pendingOrders: scopedOrders.filter((order) => order.status === "pending").length,
      orderRevenue,
      totalProducts: scopedProducts.length,
      lowStock: scopedProducts.filter((p) => getStockStatus(p.stock) === "Low stock").length,
      outOfStock: scopedProducts.filter((p) => p.stock <= 0).length,
    },
    branchSales,
  };
}

async function mockAdminReport(): Promise<DashboardReport> {
  const [orders, products, branches] = await Promise.all([
    ordersService.getOrders(),
    getProducts(),
    getBranches(),
  ]);
  return buildReport(orders, products, branches);
}

async function mockBranchReport(): Promise<DashboardReport> {
  const user = authService.getCurrentUser();
  const branchId = user?.branchId;
  const [orders, products, branches] = await Promise.all([
    ordersService.getOrders(),
    getProducts(),
    getBranches(),
  ]);
  return buildReport(orders, products, branches, branchId);
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
  /** Admin store-wide report. */
  admin(): Promise<DashboardReport> {
    return USE_MOCK ? mockAdminReport() : apiReport("/reports/summary");
  },
  /** Branch-manager report scoped to the JWT branch (manager never sends branchId). */
  branch(): Promise<DashboardReport> {
    return USE_MOCK ? mockBranchReport() : apiReport("/reports/branch");
  },
};
