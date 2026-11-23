import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Users, FileText, PawPrint, MessageCircle, CheckCircle } from "lucide-react";
import { getPageDashboard } from "@/services/portal";
import { usePageId } from "@/context/PortalPageContext";
import { portalPaths } from "@/constants/routes";
import { PageHeader, Panel } from "@/components/admin/ui";
import type { PageDashboard, ActivityItem } from "@/types/portal.types";

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 text-gray-500">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
    </div>
  );
}

function activityIcon(type: ActivityItem["type"]) {
  switch (type) {
    case "new_inquiry": return "🐾";
    case "adoption_completed": return "✅";
    case "new_follower": return "👤";
  }
}

export default function PortalDashboardPage() {
  const pageId = usePageId();
  const [data, setData] = useState<PageDashboard | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getPageDashboard(pageId)
      .then(setData)
      .catch(() => setError(true));
  }, [pageId]);

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Dashboard" />
        <p className="text-sm text-red-500">Failed to load dashboard data.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Dashboard" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Followers" value={data?.followers ?? 0} icon={Users} />
        <StatCard label="Posts" value={data?.posts ?? 0} icon={FileText} />
        <StatCard label="Active Listings" value={data?.activeListings ?? 0} icon={PawPrint} />
        <StatCard label="Pending Inquiries" value={data?.pendingInquiries ?? 0} icon={MessageCircle} />
        <StatCard label="Adoptions Done" value={data?.totalAdoptionsDone ?? 0} icon={CheckCircle} />
      </div>

      <Panel>
        <div className="border-b px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-700">Recent Activity</h2>
        </div>
        <ul className="divide-y">
          {(data?.recentActivity ?? []).map((item, i) => (
            <li key={i} className="flex items-center gap-4 px-6 py-4">
              <span className="text-lg">{activityIcon(item.type)}</span>
              <div className="flex-1 text-sm text-gray-700">{item.label}</div>
              <span className="text-xs text-gray-400">
                {(() => {
                  const d = new Date(item.occurredAt);
                  return Number.isNaN(d.getTime())
                    ? "—"
                    : formatDistanceToNow(d, { addSuffix: true });
                })()}
              </span>
              {item.listingId != null && (item.type === "new_inquiry" || item.type === "adoption_completed") && (
                <Link
                  to={portalPaths.listingDetail(item.listingId)}
                  className="text-xs font-medium text-paw-blue hover:underline"
                >
                  View
                </Link>
              )}
            </li>
          ))}
          {data?.recentActivity.length === 0 && (
            <li className="px-6 py-8 text-center text-sm text-gray-400">No recent activity.</li>
          )}
        </ul>
      </Panel>
    </div>
  );
}
