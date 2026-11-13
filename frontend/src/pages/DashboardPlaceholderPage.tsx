import { DashboardEmptyState, DashboardPageHeader } from "../shared/components/dashboard";

interface DashboardPlaceholderPageProps {
  title: string;
  description: string;
}

export default function DashboardPlaceholderPage({
  title,
  description,
}: DashboardPlaceholderPageProps) {
  return (
    <section className="mx-auto grid min-w-0 w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <DashboardPageHeader
        subTitle="Manager dashboard"
        title={title}
        description={description}
      />
      <DashboardEmptyState
        title={`${title} is not available yet`}
        description="This section is connected to the Dashboard navigation and will be implemented next."
      />
    </section>
  );
}