import { PageHeader } from "@/components/admin/ui";

export default function PortalDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome to your PetaVerse service provider portal."
      />
    </div>
  );
}
