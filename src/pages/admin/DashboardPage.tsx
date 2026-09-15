import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Users, PawPrint, Heart, Search, Users2, ShieldAlert } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { getDashboardSummary, getDashboardTimeseries } from "@/services/admin";
import type {
  DashboardSummary,
  TimeseriesResponse,
  TimeseriesMetric,
  TimeseriesRange,
} from "@/types/admin.types";
import { PageHeader, Panel, SelectField } from "@/components/admin/ui";
import { fmtNumber, errMessage } from "@/lib/adminFormat";

const ORANGE = "#f97316";
const COLORS = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch((e) => toast.error(errMessage(e, "Failed to load dashboard.")))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" subtitle="Platform overview at a glance." />

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : !summary ? (
        <p className="text-sm text-gray-400">No data.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <StatTile icon={Users} label="Users" value={summary.users.total} hint={`+${summary.users.new24h} today`} />
            <StatTile icon={PawPrint} label="Pets" value={summary.pets.total} hint={`+${summary.pets.new7d} this week`} />
            <StatTile icon={Heart} label="Adoption" value={summary.adoption.activeListings} hint={`${summary.adoption.openRequests} open requests`} />
            <StatTile icon={Search} label="Lost & Found" value={summary.lostFound.activeReports} hint={`${summary.lostFound.resolved30d} resolved / 30d`} />
            <StatTile icon={Users2} label="Communities" value={summary.community.communities} hint={`${fmtNumber(summary.community.posts7d)} posts / 7d`} />
            <StatTile icon={ShieldAlert} label="Open reports" value={summary.moderation.openReports} hint={`${summary.moderation.underReview} under review`} accent={summary.moderation.openReports > 0} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <TimeseriesCard />
            <UserBreakdown summary={summary} />
          </div>
        </>
      )}
    </div>
  );
}

function StatTile({ icon: Icon, label, value, hint, accent }: {
  icon: React.ElementType; label: string; value: number; hint?: string; accent?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className={`mb-3 inline-flex rounded-xl p-2.5 ${accent ? "bg-red-100" : "bg-paw-orange/10"}`}>
        <Icon className={`h-5 w-5 ${accent ? "text-red-500" : "text-paw-orange"}`} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{fmtNumber(value)}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeseries — now a proper area chart
// ---------------------------------------------------------------------------

const METRICS: { value: TimeseriesMetric; label: string }[] = [
  { value: "users", label: "Users" },
  { value: "pets", label: "Pets" },
  { value: "posts", label: "Posts" },
  { value: "reports", label: "Reports" },
  { value: "adoptions", label: "Adoptions" },
];

const RANGES: { value: TimeseriesRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

function TimeseriesCard() {
  const [metric, setMetric] = useState<TimeseriesMetric>("users");
  const [range, setRange] = useState<TimeseriesRange>("30d");
  const [data, setData] = useState<TimeseriesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getDashboardTimeseries({ metric, range, bucket: range === "90d" ? "week" : "day" })
      .then(setData)
      .catch((e) => toast.error(errMessage(e, "Failed to load chart.")))
      .finally(() => setLoading(false));
  }, [metric, range]);

  const points = data?.points.map((p) => ({
    date: p.date.slice(5), // MM-DD
    value: p.value,
  })) ?? [];

  return (
    <Panel className="p-6 lg:col-span-2">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">Trend</h3>
        <div className="flex gap-2">
          <SelectField value={metric} onChange={(v) => setMetric(v as TimeseriesMetric)} options={METRICS} />
          <SelectField value={range} onChange={(v) => setRange(v as TimeseriesRange)} options={RANGES} />
        </div>
      </div>
      {loading ? (
        <div className="flex h-48 items-center justify-center text-sm text-gray-400">Loading...</div>
      ) : points.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-gray-400">No data for this range.</div>
      ) : (
        <ResponsiveContainer width="100%" height={192}>
          <AreaChart data={points} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={ORANGE} stopOpacity={0.15} />
                <stop offset="95%" stopColor={ORANGE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #f3f4f6" }}
              cursor={{ stroke: ORANGE, strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Area type="monotone" dataKey="value" stroke={ORANGE} strokeWidth={2} fill="url(#areaGrad)" dot={false} activeDot={{ r: 4, fill: ORANGE }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// User breakdown — role donut + growth stats
// ---------------------------------------------------------------------------

function UserBreakdown({ summary }: { summary: DashboardSummary }) {
  const roles = Object.entries(summary.users.byRole).map(([name, value], i) => ({
    name,
    value,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <Panel className="p-6">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">Users</h3>
      <div className="grid grid-cols-2 gap-3 text-center">
        <MiniStat label="New 24h" value={summary.users.new24h} />
        <MiniStat label="New 7d" value={summary.users.new7d} />
        <MiniStat label="New 30d" value={summary.users.new30d} />
        <MiniStat label="Pending phone" value={summary.users.pendingPhoneVerification} />
      </div>
      <div className="mt-4">
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={roles} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={2}>
              {roles.map((r) => (
                <Cell key={r.name} fill={r.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #f3f4f6" }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-lg font-bold text-gray-900">{fmtNumber(value)}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
