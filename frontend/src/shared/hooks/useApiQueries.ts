import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "../api/queryKeys";
import type { ProductQuery } from "../services/product.service";
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  listProducts,
  updateProduct,
  updateProductStock,
} from "../services/product.service";
import type { ProductCreateInput, ProductInput } from "../services/product.service";
import { getCategories } from "../services/categories.service";
import type { OrderQuery, CreateOrderInput } from "../services/orders.service";
import { ordersService } from "../services/orders.service";
import type { OrderStatus } from "../types/order";
import { reviewsService } from "../services/reviews.service";
import type { ReviewInput } from "../services/reviews.service";
import { reportsService } from "../services/reports.service";
import { updateBranchStatus } from "../services/branches.service";
import {
  assignStaffBranch,
  createStaff,
  getStaff,
} from "../services/staff.service";
import type { CreateStaffInput } from "../services/staff.service";

export function useCategoriesQuery(enabled = true) {
  return useQuery({
    queryKey: ["categories"] as const,
    queryFn: getCategories,
    enabled,
  });
}

export function useProductListQuery(query: ProductQuery, enabled = true) {
  return useQuery({
    queryKey: queryKeys.products.list(query),
    queryFn: () => listProducts(query),
    enabled,
  });
}

export function useAllProductsQuery(query: ProductQuery, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.products.all, "all", query] as const,
    queryFn: () => getProducts(query),
    enabled,
  });
}

export function useProductQuery(id: string | undefined, branchId?: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id ?? "", branchId),
    queryFn: () => getProduct(id!, branchId),
    enabled: Boolean(id),
  });
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductCreateInput) => createProduct(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
  });
}

export function useUpdateProductMutation(branchId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProductInput> }) =>
      updateProduct(id, input, branchId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
  });
}

export function useDeleteProductMutation(branchId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id, branchId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
  });
}

export function useUpdateStockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, branchId, delta }: {
      productId: string;
      branchId: string;
      delta: number;
    }) => updateProductStock(productId, branchId, delta),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
  });
}

export function useOrderListQuery(query: OrderQuery, enabled = true) {
  return useQuery({
    queryKey: queryKeys.orders.list(query),
    queryFn: () => ordersService.list(query),
    enabled,
  });
}

export function useOrderQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id ?? ""),
    queryFn: () => ordersService.getOrder(id!),
    enabled: Boolean(id),
  });
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => ordersService.createOrder(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, branchId }: {
      id: string;
      status: OrderStatus;
      branchId?: string;
    }) => ordersService.updateOrderStatus(id, status, branchId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}

export function useReviewsQuery(productId: string, page: number, limit: number) {
  return useQuery({
    queryKey: queryKeys.reviews.list(productId, page, limit),
    queryFn: () => reviewsService.list(productId, page, limit),
    enabled: Boolean(productId),
  });
}

export function useInfiniteReviewsQuery(productId: string, limit: number) {
  return useInfiniteQuery({
    queryKey: queryKeys.reviews.list(productId, 1, limit),
    queryFn: ({ pageParam }) => reviewsService.list(productId, pageParam, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.limit < lastPage.total
        ? lastPage.page + 1
        : undefined,
    enabled: Boolean(productId),
  });
}

export function useUpsertReviewMutation(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReviewInput) => reviewsService.upsert(productId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.reviews.all, productId] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

export function useDeleteReviewMutation(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => reviewsService.remove(reviewId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.reviews.all, productId] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

export function useAdminReportQuery(branchId?: string) {
  return useQuery({
    queryKey: queryKeys.reports.admin(branchId),
    queryFn: () => reportsService.admin(branchId),
  });
}

export function useBranchReportQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.reports.branch,
    queryFn: () => reportsService.branch(),
    enabled,
  });
}

export function useUpdateBranchStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, status }: { branchId: string; status: "open" | "closed" }) =>
      updateBranchStatus(branchId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    },
  });
}

export function useStaffQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.staff.all,
    queryFn: getStaff,
    enabled,
  });
}

export function useCreateStaffMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStaffInput) => createStaff(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.staff.all }),
  });
}

export function useAssignStaffBranchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, branchId }: { staffId: string; branchId: string }) =>
      assignStaffBranch(staffId, branchId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.staff.all }),
  });
}
