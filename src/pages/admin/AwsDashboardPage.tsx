import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  DollarSign,
  Gift,
  Server,
  HeartPulse,
  Database,
  ShieldCheck,
  HardDrive,
  RefreshCw,
  Cpu,
  MemoryStick,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
} from "lucide-react";
import { getAwsDashboard } from "@/services/admin";
import type {
  AwsDashboard,
  AwsCostSection,
  AwsCreditsSection,
  AwsEc2Section,
  AwsApiSection,
  AwsDatabaseSection,
  AwsSecuritySection,
  AwsStorageSection,
} from "@/types/admin.types";
import { PageHeader, Panel, Tag, type Tone } from "@/components/admin/ui";
import { fmtNumber, fmtDateTime, errMessage } from "@/lib/adminFormat";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AwsDashboardPage() {
  const [data, setData] = useState<AwsDashboard | null>(null);
  const [includeCost, setIncludeCost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (withCost: boolean, mode: "initial" | "refresh" = "initial") => {
      if (mode === "refresh") setRefreshing(true);
      else setLoading(true);
      try {
        const res = await getAwsDashboard(withCost);
        setData(res);
      } catch (e) {
        toast.error(errMessage(e, "Failed to load AWS dashboard."));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    load(includeCost);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleCost = () => {
    const next = !includeCost;
    setIncludeCost(next);
    load(next, "refresh");
  };

  const handleRefresh = () => load(includeCost, "refresh");

  return (
    <div className="space-y-8">
      <PageHeader
        title="AWS Operations"
        subtitle="Infrastructure health, spend, and security at a glance."
        actions={
          <div className="flex items-center gap-2">
            {data?.cache && <CacheCountdown cache={data.cache} onExpire={handleRefresh} />}
            <button
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        }
      />

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : !data ? (
        <p className="text-sm text-gray-400">No data.</p>
      ) : (
        <>
          {/* Status strip */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <ApiTile api={data.api} />
            <Ec2StatusTile ec2={data.ec2} />
            <DatabaseTile db={data.database} />
            <SecurityTile security={data.security} />
          </div>

          {/* Cost + Credits */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <CostCard
                cost={data.cost}
                notes={data.notes}
                includeCost={includeCost}
                busy={refreshing}
                onLoadCost={handleToggleCost}
              />
            </div>
            <CreditsCard credits={data.credits} />
          </div>

          {/* Compute + Storage */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Ec2DetailCard ec2={data.ec2} />
            <StorageCard storage={data.storage} />
          </div>

          {/* Security detail */}
          <SecurityCard security={data.security} />

          {/* Notes */}
          <NotesCard notes={data.notes} />
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Field-level fallback: null/undefined → em-dash placeholder. */
function orDash(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return String(v);
}

function pct(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined) return "—";
  return `${v.toFixed(digits)}%`;
}

function money(v: number | null | undefined, currency: string): string {
  if (v === null || v === undefined) return "—";
  return `${currency === "USD" ? "$" : ""}${v.toFixed(2)}${currency !== "USD" ? ` ${currency}` : ""}`;
}

const TONE_HEX: Record<string, string> = {
  green: "#10b981",
  blue: "#3b82f6",
  amber: "#f59e0b",
  orange: "#f97316",
  red: "#ef4444",
  gray: "#9ca3af",
};

// Placeholder when a whole section is null.
function SectionPlaceholder({
  icon: Icon,
  title,
  reason,
}: {
  icon: React.ElementType;
  title: string;
  reason?: string;
}) {
  return (
    <Panel className="p-6">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="flex h-24 flex-col items-center justify-center text-center">
        <p className="text-sm text-gray-400">Unavailable</p>
        {reason && <p className="mt-1 max-w-xs text-xs text-gray-400">{reason}</p>}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Cache countdown — drives "refreshes in m:ss" from remainingSeconds
// ---------------------------------------------------------------------------

function CacheCountdown({
  cache,
  onExpire,
}: {
  cache: NonNullable<AwsDashboard["cache"]>;
  onExpire: () => void;
}) {
  const [seconds, setSeconds] = useState(cache.remainingSeconds);
  const firedRef = useRef(false);

  // Reset whenever a fresh snapshot arrives.
  useEffect(() => {
    setSeconds(cache.remainingSeconds);
    firedRef.current = false;
  }, [cache.cachedAt, cache.remainingSeconds]);

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-refresh once when the snapshot expires.
  useEffect(() => {
    if (seconds <= 0 && !firedRef.current) {
      firedRef.current = true;
      onExpire();
    }
  }, [seconds, onExpire]);

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const label = seconds <= 0 ? "refreshing…" : `refreshes in ${m}:${String(s).padStart(2, "0")}`;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-500"
      title={`Cached ${fmtDateTime(cache.cachedAt)} · expires ${fmtDateTime(cache.expiresAt)}`}
    >
      <Clock className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Status strip tiles
// ---------------------------------------------------------------------------

function StatusTile({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
  tone: Tone;
}) {
  const bg: Record<string, string> = {
    green: "bg-emerald-100",
    blue: "bg-blue-100",
    amber: "bg-amber-100",
    orange: "bg-paw-orange/10",
    red: "bg-red-100",
    gray: "bg-gray-100",
  };
  const fg: Record<string, string> = {
    green: "text-emerald-600",
    blue: "text-blue-600",
    amber: "text-amber-600",
    orange: "text-paw-orange",
    red: "text-red-600",
    gray: "text-gray-500",
  };
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className={`mb-3 inline-flex rounded-xl p-2.5 ${bg[tone]}`}>
        <Icon className={`h-5 w-5 ${fg[tone]}`} />
      </div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function apiTone(status: string): Tone {
  switch (status.toLowerCase()) {
    case "healthy":
      return "green";
    case "degraded":
      return "amber";
    case "unhealthy":
      return "red";
    default:
      return "gray";
  }
}

function ApiTile({ api }: { api: AwsApiSection | null }) {
  if (!api) {
    return <StatusTile icon={HeartPulse} label="API" value="Unavailable" tone="gray" />;
  }
  return (
    <StatusTile
      icon={HeartPulse}
      label="API"
      value={api.status}
      tone={apiTone(api.status)}
    />
  );
}

function ec2Tone(status: string): Tone {
  switch (status.toLowerCase()) {
    case "running":
      return "green";
    case "stopped":
      return "amber";
    case "none":
      return "gray";
    default:
      return "gray";
  }
}

function Ec2StatusTile({ ec2 }: { ec2: AwsEc2Section | null }) {
  if (!ec2) {
    return <StatusTile icon={Server} label="EC2" value="Unavailable" tone="gray" />;
  }
  return (
    <StatusTile
      icon={Server}
      label="EC2"
      value={ec2.status}
      hint={`${ec2.runningCount}/${ec2.totalCount} running`}
      tone={ec2Tone(ec2.status)}
    />
  );
}

function DatabaseTile({ db }: { db: AwsDatabaseSection | null }) {
  if (!db) {
    return <StatusTile icon={Database} label="Database" value="Unavailable" tone="gray" />;
  }
  return (
    <StatusTile
      icon={Database}
      label="Database"
      value={db.connected ? "Connected" : "Disconnected"}
      hint={db.responseTimeMs !== null ? `${db.responseTimeMs.toFixed(0)} ms` : undefined}
      tone={db.connected ? "green" : "red"}
    />
  );
}

function securityTone(s: AwsSecuritySection): Tone {
  if (s.openPorts.includes("ALL") || !s.sshRestricted) return "red";
  if (s.status === "Review" || s.certificatesExpiringSoon > 0) return "amber";
  return "green";
}

function SecurityTile({ security }: { security: AwsSecuritySection | null }) {
  if (!security) {
    return <StatusTile icon={ShieldCheck} label="Security" value="Unavailable" tone="gray" />;
  }
  return (
    <StatusTile
      icon={ShieldCheck}
      label="Security"
      value={security.status}
      hint={`${security.openPorts.length} open port${security.openPorts.length === 1 ? "" : "s"}`}
      tone={securityTone(security)}
    />
  );
}

// ---------------------------------------------------------------------------
// Cost card — handles skipped vs failed vs loaded
// ---------------------------------------------------------------------------

const BUDGET_TONES: Record<string, Tone> = {
  Ok: "green",
  Warning: "amber",
  Over: "red",
};

function CostCard({
  cost,
  notes,
  includeCost,
  busy,
  onLoadCost,
}: {
  cost: AwsCostSection | null;
  notes: string[];
  includeCost: boolean;
  busy: boolean;
  onLoadCost: () => void;
}) {
  // Distinguish the two meanings of cost: null via notes.
  const skipped = notes.some((n) => n.toLowerCase().includes("cost section skipped"));
  const failed = notes.some((n) => n.toLowerCase().includes("cost unavailable"));

  if (!cost) {
    return (
      <Panel className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Cost</h3>
        </div>
        <div className="flex h-40 flex-col items-center justify-center text-center">
          {failed ? (
            <>
              <XCircle className="mb-2 h-8 w-8 text-red-400" />
              <p className="text-sm font-medium text-gray-600">Cost data unavailable</p>
              <p className="mt-1 max-w-sm text-xs text-gray-400">
                The Cost Explorer call failed. Try refreshing in a moment.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500">
                Cost section not loaded.
              </p>
              <p className="mt-1 max-w-sm text-xs text-gray-400">
                Fetching this makes a billed AWS Cost Explorer call (~$0.01).
              </p>
              <button
                onClick={onLoadCost}
                disabled={busy || !skipped}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-paw-orange px-4 py-2 text-sm font-medium text-white hover:bg-paw-orange-dark disabled:opacity-40"
              >
                <DollarSign className="h-4 w-4" />
                {busy ? "Loading…" : "Load cost"}
              </button>
            </>
          )}
        </div>
      </Panel>
    );
  }

  const b = cost.budget;
  const budgetTone: Tone = b ? BUDGET_TONES[b.status] ?? "gray" : "gray";

  return (
    <Panel className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-paw-orange" />
          <h3 className="text-sm font-semibold text-gray-900">Cost</h3>
        </div>
        {includeCost && (
          <button
            onClick={onLoadCost}
            disabled={busy}
            className="text-xs font-medium text-gray-400 hover:text-gray-600 disabled:opacity-40"
          >
            Hide cost
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-xs text-gray-400">Month to date</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {money(cost.monthToDateSpend, cost.currency)}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">net, after credits</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-xs text-gray-400">Forecast (month end)</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {money(cost.forecast, cost.currency)}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">projected</p>
        </div>
      </div>

      {b ? (
        <div className="mt-5 rounded-xl border border-gray-100 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">{b.name}</p>
            <Tag tone={budgetTone}>{b.status}</Tag>
          </div>
          <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(b.percentUsed, 100)}%`,
                backgroundColor: TONE_HEX[budgetTone],
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {money(b.spent, cost.currency)} of {money(b.limit, cost.currency)} (gross)
            </span>
            <span className="font-semibold text-gray-700">{b.percentUsed}%</span>
          </div>
        </div>
      ) : (
        <p className="mt-5 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-400">
          No AWS budget defined.
        </p>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Credits card
// ---------------------------------------------------------------------------

function CreditsCard({ credits }: { credits: AwsCreditsSection | null }) {
  if (!credits) {
    return (
      <SectionPlaceholder
        icon={Gift}
        title="Credits"
        reason="Credit balance could not be retrieved."
      />
    );
  }
  return (
    <Panel className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Gift className="h-4 w-4 text-paw-orange" />
        <h3 className="text-sm font-semibold text-gray-900">Credits</h3>
      </div>
      <p className="text-4xl font-bold text-emerald-600">
        {money(credits.remaining, credits.currency)}
      </p>
      <p className="text-xs text-gray-400">official balance remaining</p>

      <div className="mt-5 space-y-3">
        <DetailRow
          label="Real-time estimate"
          value={money(credits.estimated, credits.currency)}
        />
        <DetailRow label="Expires" value={credits.expires ? fmtDateTime(credits.expires) : "—"} />
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// EC2 detail card — CPU / memory / disk gauges + uptime
// ---------------------------------------------------------------------------

function Ec2DetailCard({ ec2 }: { ec2: AwsEc2Section | null }) {
  if (!ec2) {
    return (
      <SectionPlaceholder
        icon={Server}
        title="Compute (EC2)"
        reason="EC2 metrics could not be retrieved."
      />
    );
  }
  return (
    <Panel className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-paw-orange" />
          <h3 className="text-sm font-semibold text-gray-900">Compute (EC2)</h3>
        </div>
        <Tag tone={ec2Tone(ec2.status)}>{ec2.status}</Tag>
      </div>

      <div className="space-y-4">
        <Gauge icon={Cpu} label="CPU" percent={ec2.cpuPercent} />
        <Gauge icon={MemoryStick} label="Memory" percent={ec2.memoryPercent} />
        <Gauge icon={HardDrive} label="Disk" percent={ec2.diskPercent} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
        <DetailRow label="Instances" value={`${ec2.runningCount}/${ec2.totalCount} running`} />
        <DetailRow label="Uptime" value={orDash(ec2.uptime)} />
      </div>

      {ec2.memoryNote && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {ec2.memoryNote}
        </p>
      )}
    </Panel>
  );
}

function Gauge({
  icon: Icon,
  label,
  percent,
}: {
  icon: React.ElementType;
  label: string;
  percent: number | null;
}) {
  const tone: Tone =
    percent === null ? "gray" : percent >= 90 ? "red" : percent >= 70 ? "amber" : "green";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        <span className="text-sm font-semibold text-gray-900">{pct(percent)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        {percent !== null && (
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: TONE_HEX[tone] }}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Storage card
// ---------------------------------------------------------------------------

function StorageCard({ storage }: { storage: AwsStorageSection | null }) {
  if (!storage) {
    return (
      <SectionPlaceholder
        icon={HardDrive}
        title="Storage"
        reason="Storage metrics could not be retrieved."
      />
    );
  }
  return (
    <Panel className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-paw-orange" />
          <h3 className="text-sm font-semibold text-gray-900">Storage</h3>
        </div>
        <Tag tone="gray">{storage.status}</Tag>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-xs text-gray-400">Total size</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{storage.totalSizeDisplay}</p>
          <p className="mt-0.5 text-xs text-gray-400">{fmtNumber(storage.totalBytes)} bytes</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-xs text-gray-400">Objects</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{fmtNumber(storage.objectCount)}</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <OpsRow
          label="Class A ops (MTD)"
          ops={storage.classAOps}
          percentOfFree={storage.classAPercentOfFree}
        />
        <OpsRow
          label="Class B ops (MTD)"
          ops={storage.classBOps}
          percentOfFree={storage.classBPercentOfFree}
        />
      </div>

      {storage.opsNote && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {storage.opsNote}
        </p>
      )}
    </Panel>
  );
}

function OpsRow({
  label,
  ops,
  percentOfFree,
}: {
  label: string;
  ops: number | null;
  percentOfFree: number | null;
}) {
  // percentOfFree arrives as a fraction of the free-tier allowance (e.g. 0.0222 = 2.22%).
  const barPct = percentOfFree === null ? null : Math.min(percentOfFree * 100, 100);
  const tone: Tone =
    barPct === null ? "gray" : barPct >= 90 ? "red" : barPct >= 70 ? "amber" : "green";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{fmtNumber(ops)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        {barPct !== null && (
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.max(barPct, 1)}%`, backgroundColor: TONE_HEX[tone] }}
          />
        )}
      </div>
      <p className="mt-0.5 text-[11px] text-gray-400">
        {percentOfFree === null ? "— of free tier" : `${(percentOfFree * 100).toFixed(2)}% of free tier`}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Security card — open ports, SSH, certs
// ---------------------------------------------------------------------------

function SecurityCard({ security }: { security: AwsSecuritySection | null }) {
  if (!security) {
    return (
      <SectionPlaceholder
        icon={ShieldCheck}
        title="Security"
        reason="Security posture could not be retrieved."
      />
    );
  }

  const hasAll = security.openPorts.includes("ALL");

  return (
    <Panel className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-paw-orange" />
          <h3 className="text-sm font-semibold text-gray-900">Security</h3>
        </div>
        <Tag tone={securityTone(security)}>{security.status}</Tag>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Open ports */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Open ports (0.0.0.0/0)
          </p>
          {hasAll && (
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              ALL ports world-open
            </p>
          )}
          {security.openPorts.length === 0 ? (
            <p className="text-sm text-gray-400">None</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {security.openPorts.map((port) => (
                <span
                  key={port}
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                    port === "ALL" || port === "22"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {port}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* SSH */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            SSH access (port 22)
          </p>
          <div className="flex items-center gap-2">
            {security.sshRestricted ? (
              <>
                <Lock className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Restricted</p>
                  <p className="text-xs text-gray-400">Not open to the world</p>
                </div>
              </>
            ) : (
              <>
                <Unlock className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-600">World-open</p>
                  <p className="text-xs text-gray-400">Port 22 reachable from 0.0.0.0/0</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Certs */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Certificates
          </p>
          <div className="flex items-center gap-2">
            {security.certificatesExpiringSoon > 0 ? (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {security.certificatesExpiringSoon} expiring soon
                  </p>
                  <p className="text-xs text-gray-400">Within 30 days</p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">All current</p>
                  <p className="text-xs text-gray-400">None expiring within 30 days</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Notes card
// ---------------------------------------------------------------------------

function NotesCard({ notes }: { notes: string[] }) {
  if (!notes || notes.length === 0) return null;
  return (
    <Panel className="p-6">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900">Notes</h3>
      </div>
      <ul className="space-y-2">
        {notes.map((note, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
            {note}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// DetailRow
// ---------------------------------------------------------------------------

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}
