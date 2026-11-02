import { useState } from "react";
import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";

import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import type { DashboardSidebarItem } from "../components/dashboard/DashboardSidebar";

interface DashboardLayoutProps {
  sidebarItems: DashboardSidebarItem[];
  sidebarTitle?: string;
  sidebarSubtitle?: string;
  topbar?: ReactNode;
}

export default function DashboardLayout({
  sidebarItems,
  sidebarTitle,
  sidebarSubtitle,
  topbar,
}: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface-cream">
      <DashboardSidebar
        items={sidebarItems}
        title={sidebarTitle}
        subtitle={sidebarSubtitle}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center border-b border-border-subtle bg-surface-white">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open dashboard navigation"
            className="m-2 inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-brand-navy hover:bg-surface-cream lg:hidden"
          >
            <Menu aria-hidden="true" size={20} />
          </button>
          <div className="min-w-0 flex-1">{topbar}</div>
        </header>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      {isSidebarOpen && (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close dashboard navigation"
          className="fixed inset-0 z-20 bg-brand-navy/40 lg:hidden"
        />
      )}
    </div>
  );
}
