import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  getFeedAnalytics, getFeedEngagement,
  getPetHealthAnalytics, getServicesAnalytics,
  getChatAnalytics, getMediaAnalytics, getNotificationsAnalytics,
} from "@/services/admin";
import type {
  FeedAnalytics, FeedEngagement, PetHealthAnalytics,
  ServicesAnalytics, ChatAnalytics, MediaAnalytics, NotificationsAnalytics,
} from "@/types/admin.types";
import { PageHeader, Panel, Tag } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { fmtNumber } from "@/lib/adminFormat";

// ---------------------------------------------------------------------------
// Shared palette + helpers
// ---------------------------------------------------------------------------

const ORANGE = "#f97316";
const COLORS = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#84cc16"];

function bytes(b: number): string {
  if (b >= 1_073_741_824) return `${(b / 1_073_741_824).toFixed(1)} GB`;
  if (b >= 1_048_576) return `${(b / 1_048_576).toFixed(1)} MB`;
  return `${(b / 1024).toFixed(0)} KB`;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">
        {typeof value === "number" ? fmtNumber(value) : value}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function EmptyPanel({ children }: { children: React.ReactNode }) {
  return (
    <Panel>
      <p className="px-6 py-14 text-center text-sm text-gray-400">{children}</p>
    </Panel>
  );
}

function ChartTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-4 text-sm font-semibold text-gray-900">{children}</h3>;
}

const tooltipStyle = { fontSize: 12, borderRadius: 8, border: "1px solid #f3f4f6" };

// ---------------------------------------------------------------------------
// Social Feed
// ---------------------------------------------------------------------------

function FeedSection() {
  const [feed, setFeed] = useState<FeedAnalytics | null>(null);
  const [engagement, setEngagement] = useState<FeedEngagement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getFeedAnalytics(), getFeedEngagement()])
      .then(([f, e]) => { setFeed(f); setEngagement(e); })
      .catch(() => toast.error("Failed to load feed analytics."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <EmptyPanel>Loading...</EmptyPanel>;
  if (!feed || !engagement) return <EmptyPanel>No data.</EmptyPanel>;

  const visibilityData = [
    { name: "Public", value: feed.visibilityBreakdown.public },
    { name: "Followers", value: feed.visibilityBreakdown.followers },
    { name: "Private", value: feed.visibilityBreakdown.private },
  ];

  const engagementData = [
    { name: "0 engagement", value: engagement.postsWith0Engagement },
    { name: "1-10 likes", value: engagement.postsWith1to10Likes },
    { name: "10+ likes", value: engagement.postsWith10PlusLikes },
  ];

  const hashtagData = feed.topHashtags.slice(0, 8).map((h) => ({
    name: `#${h.tag}`,
    posts: h.postCount,
  }));

  const topPetsData = feed.topPetsByFollowers.slice(0, 6).map((p) => ({
    name: p.petName,
    followers: p.value,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total posts" value={feed.totalPosts} />
        <Stat label="Posts today" value={feed.postsToday} />
        <Stat label="Posts (7d)" value={feed.posts7d} />
        <Stat label="Total likes" value={feed.totalLikes} />
        <Stat label="Total comments" value={feed.totalComments} />
        <Stat label="Total shares" value={feed.totalShares} />
        <Stat label="Total saves" value={feed.totalSaves} />
        <Stat label="Total follows" value={feed.totalFollows} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel className="p-6">
          <ChartTitle>Visibility breakdown</ChartTitle>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={visibilityData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {visibilityData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>

        <Panel className="p-6">
          <ChartTitle>Engagement distribution</ChartTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={engagementData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" name="Posts" fill={ORANGE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 divide-y divide-gray-50">
            <Row label="Avg likes / post" value={engagement.avgLikesPerPost.toFixed(2)} />
            <Row label="Avg comments / post" value={engagement.avgCommentsPerPost.toFixed(2)} />
            <Row label="Avg shares / post" value={engagement.avgSharesPerPost.toFixed(2)} />
          </div>
        </Panel>

        {hashtagData.length > 0 && (
          <Panel className="p-6">
            <ChartTitle>Top hashtags</ChartTitle>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hashtagData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} width={90} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="posts" name="Posts" fill={ORANGE} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        )}

        {topPetsData.length > 0 && (
          <Panel className="p-6">
            <ChartTitle>Top pets by followers</ChartTitle>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topPetsData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} width={72} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="followers" name="Followers" fill={COLORS[1]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pet Health
// ---------------------------------------------------------------------------

function PetHealthSection() {
  const [data, setData] = useState<PetHealthAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPetHealthAnalytics()
      .then(setData)
      .catch(() => toast.error("Failed to load pet health analytics."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <EmptyPanel>Loading...</EmptyPanel>;
  if (!data) return <EmptyPanel>No data.</EmptyPanel>;

  const sterilData = [
    { name: "Sterilized", value: data.sterilization.sterilized },
    { name: "Not sterilized", value: data.sterilization.notSterilized },
    { name: "Unknown", value: data.sterilization.unknown },
  ];

  const coverageData = [
    { name: "Vaccinated", value: data.petsWithVaccinations },
    { name: "Medicated", value: data.petsWithActiveMedications },
    { name: "Conditions", value: data.petsWithHealthConditions },
    { name: "Weight log", value: data.petsWithWeightHistory },
    { name: "Activity", value: data.petsWithActivityRecords },
  ];

  const vaccineData = data.topVaccines.slice(0, 6).map((v) => ({ name: v.vaccineName, count: v.count }));
  const medData = data.topMedications.slice(0, 6).map((m) => ({ name: m.medicationName, count: m.count }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total pets" value={data.totalPets} />
        <Stat label="With vaccinations" value={data.petsWithVaccinations} />
        <Stat label="Overdue vaccinations" value={data.petsWithOverdueVaccinations} />
        <Stat label="Active medications" value={data.petsWithActiveMedications} />
        <Stat label="Overdue medications" value={data.petsWithOverdueMedications} />
        <Stat label="Health conditions" value={data.petsWithHealthConditions} />
        <Stat label="Weight history" value={data.petsWithWeightHistory} />
        <Stat label="Activity records" value={data.petsWithActivityRecords} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel className="p-6">
          <ChartTitle>Sterilization</ChartTitle>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={sterilData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {sterilData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>

        <Panel className="p-6">
          <ChartTitle>Health coverage (out of {fmtNumber(data.totalPets)} pets)</ChartTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={coverageData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" name="Pets" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        {vaccineData.length > 0 && (
          <Panel className="p-6">
            <ChartTitle>Top vaccines</ChartTitle>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={vaccineData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Pets" fill={COLORS[3]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        )}

        {medData.length > 0 && (
          <Panel className="p-6">
            <ChartTitle>Top medications</ChartTitle>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={medData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Pets" fill={COLORS[4]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        )}
      </div>

      {data.healthBySpecies.length > 0 && (
        <Panel className="p-6">
          <ChartTitle>Health by species</ChartTitle>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.healthBySpecies.map((s) => ({ name: s.speciesName, pets: s.petCount, conditions: s.conditionCount }))} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="pets" name="Pets" fill={ORANGE} radius={[4, 4, 0, 0]} />
              <Bar dataKey="conditions" name="Conditions" fill={COLORS[5]} radius={[4, 4, 0, 0]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

function ServicesSection() {
  const [data, setData] = useState<ServicesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getServicesAnalytics()
      .then(setData)
      .catch(() => toast.error("Failed to load services analytics."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <EmptyPanel>Loading...</EmptyPanel>;
  if (!data) return <EmptyPanel>No data.</EmptyPanel>;

  const apptData = [
    { name: "Pending", value: data.appointments.pending },
    { name: "Confirmed", value: data.appointments.confirmed },
    { name: "Completed", value: data.appointments.completed },
    { name: "Cancelled", value: data.appointments.cancelled },
  ];

  const providerData = data.topRatedProviders.slice(0, 6).map((p) => ({
    name: p.name.length > 16 ? p.name.slice(0, 15) + "…" : p.name,
    rating: p.avgRating,
    appointments: p.appointmentCount,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total providers" value={data.totalProviders} />
        <Stat label="Verified" value={data.verifiedProviders} />
        <Stat label="Vet providers" value={data.vetProviders} />
        <Stat label="No appointments" value={data.providersWithNoAppointments} />
        <Stat label="Total appointments" value={data.appointments.total} />
        <Stat label="This week" value={data.appointments.appointmentsThisWeek} />
        <Stat label="This month" value={data.appointments.appointmentsThisMonth} />
        <Stat label="Avg rating" value={data.averageRating.toFixed(2)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel className="p-6">
          <ChartTitle>Appointment status</ChartTitle>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={apptData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {apptData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>

        <Panel className="p-6">
          <ChartTitle>By provider type</ChartTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.byProviderType.map((t) => ({ name: t.typeName, count: t.count }))} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" name="Providers" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        {providerData.length > 0 && (
          <Panel className="p-6 lg:col-span-2">
            <ChartTitle>Top rated providers</ChartTitle>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={providerData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" domain={[0, 5]} tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="rating" name="Avg rating" fill={ORANGE} radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="appointments" name="Appointments" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI Chat
// ---------------------------------------------------------------------------

function ChatSection() {
  const [data, setData] = useState<ChatAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChatAnalytics()
      .then(setData)
      .catch(() => toast.error("Failed to load chat analytics."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <EmptyPanel>Loading...</EmptyPanel>;
  if (!data) return <EmptyPanel>No data.</EmptyPanel>;

  const sessionTypeData = [
    { name: "Pet-specific", value: data.petSpecificSessions },
    { name: "General", value: data.generalSessions },
    { name: "Archived", value: data.archivedSessions },
  ];

  const modelData = data.byModel.map((m) => ({
    name: m.modelId.length > 20 ? m.modelId.slice(0, 19) + "…" : m.modelId,
    input: Math.round(m.inputTokens / 1000),
    output: Math.round(m.outputTokens / 1000),
    messages: m.messageCount,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total sessions" value={data.totalSessions} />
        <Stat label="Active" value={data.activeSessions} />
        <Stat label="Sessions (7d)" value={data.sessionsThisWeek} />
        <Stat label="Sessions (30d)" value={data.sessionsThisMonth} />
        <Stat label="Total messages" value={data.totalMessages} />
        <Stat label="Unique users (7d)" value={data.uniqueUsersThisWeek} />
        <Stat label="Input tokens" value={fmtNumber(data.totalInputTokens)} />
        <Stat label="Avg msgs/session" value={data.avgMessagesPerSession.toFixed(2)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel className="p-6">
          <ChartTitle>Session types</ChartTitle>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={sessionTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {sessionTypeData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>

        {modelData.length > 0 && (
          <Panel className="p-6">
            <ChartTitle>Token usage by model (K tokens)</ChartTitle>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={modelData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}K`, undefined]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="input" name="Input (K)" fill={ORANGE} radius={[4, 4, 0, 0]} stackId="tokens" />
                <Bar dataKey="output" name="Output (K)" fill={COLORS[1]} radius={[0, 0, 0, 0]} stackId="tokens" />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

function MediaSection() {
  const [data, setData] = useState<MediaAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMediaAnalytics()
      .then(setData)
      .catch(() => toast.error("Failed to load media analytics."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <EmptyPanel>Loading...</EmptyPanel>;
  if (!data) return <EmptyPanel>No data.</EmptyPanel>;

  const statusData = [
    { name: "Confirmed", value: data.confirmedAssets },
    { name: "Unconfirmed", value: data.unconfirmedAssets },
    { name: "Orphaned", value: data.orphanedAssets },
  ];

  const categoryData = data.byCategory.map((c) => ({
    name: c.category,
    count: c.count,
    gb: parseFloat((c.sizeBytes / 1_073_741_824).toFixed(2)),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total assets" value={data.totalAssets} />
        <Stat label="Confirmed" value={data.confirmedAssets} />
        <Stat label="Unconfirmed" value={data.unconfirmedAssets} />
        <Stat label="Orphaned" value={data.orphanedAssets} />
        <Stat label="Total size" value={bytes(data.totalSizeBytes)} />
        <Stat label="Confirmed size" value={bytes(data.confirmedSizeBytes)} />
        <Stat label="Uploaded today" value={data.assetsUploadedToday} />
        <Stat label="Uploaded (7d)" value={data.assetsUploadedThisWeek} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel className="p-6">
          <ChartTitle>Asset status</ChartTitle>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {statusData.map((_, i) => <Cell key={i} fill={[COLORS[2], COLORS[4], COLORS[5]][i]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          {data.orphanedAssets > 0 && (
            <p className="mt-2 text-center text-xs text-amber-600">
              {fmtNumber(data.orphanedAssets)} orphaned assets are safe to prune.
            </p>
          )}
        </Panel>

        {categoryData.length > 0 && (
          <Panel className="p-6">
            <ChartTitle>Storage by category (GB)</ChartTitle>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} unit=" GB" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} width={100} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} GB`, "Size"]} />
                <Bar dataKey="gb" name="Size (GB)" fill={ORANGE} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

function NotificationsSection() {
  const [data, setData] = useState<NotificationsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotificationsAnalytics()
      .then(setData)
      .catch(() => toast.error("Failed to load notifications analytics."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <EmptyPanel>Loading...</EmptyPanel>;
  if (!data) return <EmptyPanel>No data.</EmptyPanel>;

  const platformData = [
    { name: "iOS", value: data.ioSTokens },
    { name: "Android", value: data.androidTokens },
  ];

  const optOutData = [
    { name: "Lost pet nearby", value: data.optOutRates.lostPetNearbyOptOut },
    { name: "Community", value: data.optOutRates.communityInteractionsOptOut },
    { name: "New follower", value: data.optOutRates.newFollowerOptOut },
    { name: "Medication", value: data.optOutRates.medicationOptOut },
    { name: "Mentions", value: data.optOutRates.mentionsOptOut },
    { name: "Adoption", value: data.optOutRates.adoptionOptOut },
    { name: "Vaccination", value: data.optOutRates.vaccinationOptOut },
    { name: "Appointment", value: data.optOutRates.appointmentOptOut },
    { name: "Co-ownership", value: data.optOutRates.coOwnershipOptOut },
  ].sort((a, b) => b.value - a.value);

  const unreadData = data.unreadByType
    .slice(0, 8)
    .sort((a, b) => b.count - a.count)
    .map((u) => ({ name: u.type, count: u.count }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Device tokens" value={data.totalDeviceTokens} />
        <Stat label="iOS tokens" value={data.ioSTokens} />
        <Stat label="Android tokens" value={data.androidTokens} />
        <Stat label="Users without device" value={data.usersWithNoDevices} />
        <Stat label="Stale tokens (90d)" value={data.staleTokens} />
        <Stat label="Unread notifications" value={data.totalUnreadNotifications} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel className="p-6">
          <ChartTitle>Platform split</ChartTitle>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={platformData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                <Cell fill={COLORS[5]} />
                <Cell fill={COLORS[2]} />
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          {data.staleTokens > 0 && (
            <p className="mt-2 text-center text-xs text-amber-600">
              {fmtNumber(data.staleTokens)} stale tokens (not updated in 90 days).
            </p>
          )}
        </Panel>

        <Panel className="p-6">
          <ChartTitle>Opt-out counts (sorted)</ChartTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={optOutData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} width={100} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" name="Users opted out" fill={COLORS[5]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        {unreadData.length > 0 && (
          <Panel className="p-6 lg:col-span-2">
            <ChartTitle>Unread notifications by type</ChartTitle>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={unreadData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Unread" fill={ORANGE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type Section = "feed" | "pet-health" | "services" | "chat" | "media" | "notifications";

const SECTIONS: { key: Section; label: string }[] = [
  { key: "feed", label: "Social Feed" },
  { key: "pet-health", label: "Pet Health" },
  { key: "services", label: "Services" },
  { key: "chat", label: "AI Chat" },
  { key: "media", label: "Media" },
  { key: "notifications", label: "Notifications" },
];

const SECTION_MAP: Record<Section, React.FC> = {
  feed: FeedSection,
  "pet-health": PetHealthSection,
  services: ServicesSection,
  chat: ChatSection,
  media: MediaSection,
  notifications: NotificationsSection,
};

export default function AnalyticsPage() {
  const [active, setActive] = useState<Section>("feed");
  const [refreshKey, setRefreshKey] = useState(0);
  const ActiveSection = SECTION_MAP[active];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Platform-wide analytics dashboards."
        actions={
          <Button variant="outline" size="sm" onClick={() => setRefreshKey((k) => k + 1)}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        }
      />

      <div className="flex flex-wrap gap-1">
        {SECTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active === key
                ? "bg-paw-orange text-white"
                : "bg-white text-gray-600 shadow-sm hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ActiveSection key={`${active}-${refreshKey}`} />
    </div>
  );
}
