import type { OrderStatus as StatusType } from "../types/order";

interface OrderStatusProps {
  status: StatusType;
}

const statusStyles: Record<StatusType, string> = {
  pending: "bg-status-warning/10 text-status-warning",
  processing: "bg-status-info/10 text-status-info",
  shipped: "bg-brand-navy/10 text-brand-navy",
  delivered: "bg-status-success/10 text-status-success",
  cancelled: "bg-status-error/10 text-status-error",
};

const statusLabels: Record<StatusType, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function OrderStatus({ status }: OrderStatusProps) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}