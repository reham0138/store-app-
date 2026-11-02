import {
  BarChart3,
  Boxes,
  ClipboardList,
  GitBranch,
  LayoutDashboard,
  PackageSearch,
  Users,
} from "lucide-react";

import type { DashboardSidebarItem } from "../components/dashboard";

export const managerDashboardNavigation: DashboardSidebarItem[] = [
  {
    label: "Overview",
    path: "/manager/dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: "Orders",
    path: "/manager/orders",
    icon: <ClipboardList size={18} />,
  },
  {
    label: "Products",
    path: "/manager/products",
    icon: <PackageSearch size={18} />,
  },
  {
    label: "Inventory",
    path: "/manager/inventory",
    icon: <Boxes size={18} />,
  },
  {
    label: "Reports",
    path: "/manager/reports",
    icon: <BarChart3 size={18} />,
  },
];

export const adminDashboardNavigation: DashboardSidebarItem[] = [
  {
    label: "Overview",
    path: "/admin/dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: "Branches",
    path: "/admin/branches",
    icon: <GitBranch size={18} />,
  },
  {
    label: "Managers",
    path: "/admin/managers",
    icon: <Users size={18} />,
  },
  {
    label: "Orders",
    path: "/admin/orders",
    icon: <ClipboardList size={18} />,
  },
  {
    label: "Products",
    path: "/admin/products",
    icon: <PackageSearch size={18} />,
  },
  {
    label: "Inventory",
    path: "/admin/inventory",
    icon: <Boxes size={18} />,
  },
  {
    label: "Reports",
    path: "/admin/reports",
    icon: <BarChart3 size={18} />,
  },
];
