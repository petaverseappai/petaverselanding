import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MessageSquare, AlertTriangle, Shield, Zap, Copy, Check } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  getOtpSummary,
  getOtpPrefixes,
  getOtpAbuse,
  getOtpState,
  resetOtpEmergency,
  getOtpProviderBalance,
} from "@/services/admin";
import type {
  OtpSummary,
  OtpPrefixMetric,
  OtpAbuseReport,
  OtpState,
  OtpProviderBalance,
} from "@/types/admin.types";
import { PageHeader, Panel, ConfirmModal } from "@/components/admin/ui";
import { fmtNumber, errMessage } from "@/lib/adminFormat";

const STATE_COLORS: Record<string, string> = {
  Normal: "#10b981",
  Warning: "#f59e0b",
  Throttle: "#f97316",
  Emergency: "#ef4444",
};

export default function OtpDashboardPage() {
  const [summary, setSummary] = useState<OtpSummary | null>(null);
  const [state, setState] = useState<OtpState | null>(null);
  const [balance, setBalance] = useState<OtpProviderBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    Promise.all([getOtpSummary(), getOtpState(), getOtpProviderBalance()])
      .then(([s, st, b]) => {
        setSummary(s);
        setState(st);
        setBalance(b);
      })
      .catch((e) => toast.error(errMessage(e, "Failed to load OTP summary.")))
      .finally(() => setLoading(false));
  }, []);

  const handleResetEmergency = async () => {
    setResetting(true);
    try {
      await resetOtpEmergency();
      toast.success("Emergency circuit breaker reset.");
      setState({ state: "Normal" });
    } catch (e) {
      toast.error(errMessage(e, "Failed to reset emergency."));
    } finally {
      setResetting(false);
      setShowResetConfirm(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="OTP Tracking"
        subtitle="Monitor OTP traffic, verification rates, and security metrics."
        actions={
          state?.state === "Emergency" && (
            <button
              onClick={() => setShowResetConfirm(true)}
              disabled={resetting}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40"
            >
              Reset Emergency
            </button>
          )
        }
      />

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : !summary || !state ? (
        <p className="text-sm text-gray-400">No data.</p>
      ) : (
        <>
          {balance && <ProviderBalanceCard balance={balance} />}

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile
              icon={MessageSquare}
              label="Today's Requests"
              value={summary.requestsToday}
              tone="blue"
            />
            <StatTile
              icon={Shield}
              label="Verifications"
              value={summary.verificationsSucceededToday}
              hint={`${summary.verificationsFailedToday} failed`}
              tone="green"
            />
            <StatTile
              icon={AlertTriangle}
              label="Failed Verifications"
              value={summary.verificationsFailedToday}
              tone={summary.verificationsFailedToday > 5 ? "orange" : "gray"}
            />
            <StatTile
              icon={Zap}
              label="CAPTCHA Challenges"
              value={summary.captchaChallengesTotal}
              hint={`${summary.captchaAcknowledgedTotal} ack'd`}
              tone="orange"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <StateCard state={state} />
            <RateCard summary={summary} />
            <HourlyCard summary={summary} />
          </div>

          <PrefixMetricsCard />
          <AbuseReportCard />
        </>
      )}

      <ConfirmModal
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetEmergency}
        title="Reset Emergency Circuit Breaker"
        message="This will immediately resume OTP generation. Use only after the attack has stopped."
        confirmLabel="Reset"
        danger
      />
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  tone = "gray",
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  hint?: string;
  tone?: string;
}) {
  const bgColors: Record<string, string> = {
    blue: "bg-blue-100",
    green: "bg-emerald-100",
    orange: "bg-amber-100",
    red: "bg-red-100",
    gray: "bg-gray-100",
  };

  const iconColors: Record<string, string> = {
    blue: "text-blue-600",
    green: "text-emerald-600",
    orange: "text-amber-600",
    red: "text-red-600",
    gray: "text-gray-600",
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className={`mb-3 inline-flex rounded-xl p-2.5 ${bgColors[tone]}`}>
        <Icon className={`h-5 w-5 ${iconColors[tone]}`} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{fmtNumber(value)}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function StateCard({ state }: { state: OtpState }) {
  const isEmergency = state.state === "Emergency";
  const isThrottle = state.state === "Throttle";
  const isWarning = state.state === "Warning";

  return (
    <Panel className="p-6">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">Global State</h3>
      <div className="flex items-center gap-4">
        <div
          className="h-16 w-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${STATE_COLORS[state.state]}20` }}
        >
          <div
            className="h-12 w-12 rounded-full"
            style={{ backgroundColor: STATE_COLORS[state.state] }}
          />
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">{state.state}</p>
          <p className="text-xs text-gray-400">
            {isEmergency
              ? "OTP generation blocked"
              : isThrottle
                ? "OTP generation throttled"
                : isWarning
                  ? "Elevated activity"
                  : "Operating normally"}
          </p>
        </div>
      </div>
    </Panel>
  );
}

function RateCard({ summary }: { summary: OtpSummary }) {
  const rate = summary.verificationRateToday;
  const rateLastHour = summary.verificationRateLastHour;

  return (
    <Panel className="p-6">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">Verification Rate</h3>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-500">Today</p>
            {rate !== null ? (
              <p className="text-sm font-semibold text-gray-900">{(rate * 100).toFixed(1)}%</p>
            ) : (
              <p className="text-xs text-gray-400">Insufficient data</p>
            )}
          </div>
          {rate !== null && (
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${rate * 100}%` }}
              />
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-500">Last Hour</p>
            {rateLastHour !== null ? (
              <p className="text-sm font-semibold text-gray-900">{(rateLastHour * 100).toFixed(1)}%</p>
            ) : (
              <p className="text-xs text-gray-400">Insufficient data</p>
            )}
          </div>
          {rateLastHour !== null && (
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${rateLastHour * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

function HourlyCard({ summary }: { summary: OtpSummary }) {
  return (
    <Panel className="p-6">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">Activity</h3>
      <div className="space-y-3">
        <MetricRow label="Last Hour" value={summary.requestsLastHour} />
        <MetricRow label="Last 10 Minutes" value={summary.requestsLast10Minutes} />
        <MetricRow label="SMS Sent (Last Hour)" value={summary.smsLastHour} />
        <MetricRow label="Rate Limited" value={summary.rateLimitedTotal} />
        <MetricRow label="Blocked (Emergency)" value={summary.blockedEmergencyTotal} />
      </div>
    </Panel>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <p className="text-gray-500">{label}</p>
      <p className="font-semibold text-gray-900">{fmtNumber(value)}</p>
    </div>
  );
}

function PrefixMetricsCard() {
  const [prefixes, setPrefixes] = useState<OtpPrefixMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOtpPrefixes()
      .then(setPrefixes)
      .catch((e) => toast.error(errMessage(e, "Failed to load prefix metrics.")))
      .finally(() => setLoading(false));
  }, []);

  const chartData = prefixes.map((p) => ({
    prefix: p.prefix,
    requests: p.otpRequests,
    rate: p.verificationRate !== null ? Number((p.verificationRate * 100).toFixed(1)) : 0,
  }));

  return (
    <Panel className="p-6">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">OTP by Prefix</h3>
      {loading ? (
        <div className="flex h-48 items-center justify-center text-sm text-gray-400">Loading...</div>
      ) : prefixes.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-gray-400">No data.</div>
      ) : (
        <>
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="prefix" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #f3f4f6" }}
                />
                <Bar dataKey="requests" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {prefixes.map((p) => (
              <PrefixRow key={p.prefix} prefix={p} />
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}

function PrefixRow({ prefix }: { prefix: OtpPrefixMetric }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-gray-900">
          {prefix.prefix === "XX" ? "Non-Lebanese" : `+961 ${prefix.prefix}`}
        </p>
        <p className="text-xs text-gray-500">
          {prefix.smsSent} SMS sent, {prefix.verified} verified
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">{fmtNumber(prefix.otpRequests)}</p>
        <p className="text-xs text-gray-500">
          {prefix.verificationRate !== null
            ? `${(prefix.verificationRate * 100).toFixed(1)}% rate`
            : "Insufficient data"}
        </p>
      </div>
    </div>
  );
}

function AbuseReportCard() {
  const [abuse, setAbuse] = useState<OtpAbuseReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    getOtpAbuse()
      .then(setAbuse)
      .catch((e) => toast.error(errMessage(e, "Failed to load abuse report.")))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Panel className="p-6">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">Abuse Indicators</h3>
      {loading ? (
        <div className="flex h-48 items-center justify-center text-sm text-gray-400">Loading...</div>
      ) : !abuse ? (
        <div className="flex h-48 items-center justify-center text-sm text-gray-400">No data.</div>
      ) : (
        <div className="space-y-6">
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Top IP Hashes
            </h4>
            <div className="space-y-2">
              {abuse.topIpHashes.length === 0 ? (
                <p className="text-xs text-gray-400">No abuse detected.</p>
              ) : (
                abuse.topIpHashes.map((ip) => (
                  <AbuseRow
                    key={ip.key}
                    metric={ip}
                    onCopy={handleCopy}
                    copied={copied === ip.key}
                  />
                ))
              )}
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Top Device Hashes
            </h4>
            <div className="space-y-2">
              {abuse.topDeviceHashes.length === 0 ? (
                <p className="text-xs text-gray-400">No abuse detected.</p>
              ) : (
                abuse.topDeviceHashes.map((dev) => (
                  <AbuseRow
                    key={dev.key}
                    metric={dev}
                    onCopy={handleCopy}
                    copied={copied === dev.key}
                  />
                ))
              )}
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Top Phone Prefixes
            </h4>
            <div className="space-y-2">
              {abuse.topPhonePrefixes.length === 0 ? (
                <p className="text-xs text-gray-400">No abuse detected.</p>
              ) : (
                abuse.topPhonePrefixes.map((prefix) => (
                  <div key={prefix.key} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">+961 {prefix.key}</p>
                    <p className="text-sm font-semibold text-gray-700">{fmtNumber(prefix.count)}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <p className="text-gray-600">CAPTCHA Rate</p>
                <p className="font-semibold text-gray-900">{(abuse.captchaRate * 100).toFixed(2)}%</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-gray-600">Rate Limit Rate</p>
                <p className="font-semibold text-gray-900">{(abuse.rateLimitRate * 100).toFixed(2)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}

function AbuseRow({
  metric,
  onCopy,
  copied,
}: {
  metric: { key: string; count: number };
  onCopy: (text: string, key: string) => void;
  copied: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 group hover:bg-gray-100 transition">
      <div className="flex-1">
        <p className="text-sm font-mono text-gray-700 break-all">{metric.key}</p>
        <p className="text-xs text-gray-500">{fmtNumber(metric.count)} requests</p>
      </div>
      <button
        onClick={() => onCopy(metric.key, metric.key)}
        className="ml-2 rounded-lg p-2 text-gray-400 hover:bg-white hover:text-gray-600 opacity-0 group-hover:opacity-100 transition"
        title="Copy hash"
      >
        {copied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

function ProviderBalanceCard({ balance }: { balance: OtpProviderBalance }) {
  const isLow = balance.balance < 5;
  const isCritical = balance.balance < 1;

  return (
    <Panel className={`p-8 ${isCritical ? "border-2 border-red-500 bg-red-50" : isLow ? "border-2 border-amber-500 bg-amber-50" : ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">OTP Provider Balance</p>
          <p className={`mt-2 text-5xl font-bold ${isCritical ? "text-red-600" : isLow ? "text-amber-600" : "text-emerald-600"}`}>
            ${balance.balance.toFixed(4)}
          </p>
          <p className={`mt-2 text-sm font-medium ${isCritical ? "text-red-700" : isLow ? "text-amber-700" : "text-emerald-700"}`}>
            {isCritical
              ? "CRITICAL: Balance below $1"
              : isLow
                ? "WARNING: Balance below $5"
                : "Status: Healthy"}
          </p>
        </div>
        <div className={`h-24 w-24 rounded-full flex items-center justify-center ${isCritical ? "bg-red-200" : isLow ? "bg-amber-200" : "bg-emerald-200"}`}>
          <Shield className={`h-12 w-12 ${isCritical ? "text-red-600" : isLow ? "text-amber-600" : "text-emerald-600"}`} />
        </div>
      </div>
    </Panel>
  );
}
