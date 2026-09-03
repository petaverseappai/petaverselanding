import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getWaitlist } from "@/services/admin";
import { Mails } from "lucide-react";

export default function DashboardPage() {
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWaitlist()
      .then((data) => setTotal(data.total))
      .catch(() => toast.error("Failed to load stats."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">Welcome back. Here's what's happening.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Waitlist signups"
          value={loading ? "..." : (total ?? 0).toString()}
          icon={Mails}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm flex items-center gap-4">
      <div className="rounded-xl bg-paw-orange/10 p-3">
        <Icon className="h-5 w-5 text-paw-orange" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
