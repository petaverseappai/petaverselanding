import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  getModerationReports,
  getModerationStats,
} from "@/services/admin";
import type {
  ReportListItem,
  ModerationStats,
  ReportTargetType,
} from "@/types/admin.types";
import { REPORT_STATUS, REPORT_REASON } from "@/types/admin.types";
import {
  PageHeader,
  Panel,
  Table,
  THead,
  TBody,
  TH,
  TR,
  TD,
  Tag,
  Pagination,
  EmptyState,
  FilterBar,
  SelectField,
} from "@/components/admin/ui";
import { adminPaths } from "@/constants/routes";
import { fmtDateTime, reportStatusTone, errMessage } from "@/lib/adminFormat";

const STATUS_OPTS = Object.entries(REPORT_STATUS).map(([value, label]) => ({
  value,
  label,
}));
const REASON_OPTS = Object.entries(REPORT_REASON).map(([value, label]) => ({
  value,
  label,
}));
const TARGET_OPTS = [
  { value: "post", label: "Post" },
  { value: "comment", label: "Comment" },
  { value: "pet", label: "Pet" },
];

export default function ModerationPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ModerationStats | null>(null);

  const [status, setStatus] = useState("");
  const [reason, setReason] = useState("");
  const [targetType, setTargetType] = useState("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<ReportListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getModerationStats()
      .then(setStats)
      .catch(() => {
        /* header stats are non-critical */
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    getModerationReports({
      status: status === "" ? undefined : Number(status),
      reason: reason === "" ? undefined : Number(reason),
      targetType: (targetType || undefined) as ReportTargetType | undefined,
      page,
      pageSize: 20,
    })
      .then((res) => {
        setItems(res.items);
        setTotalPages(res.totalPages);
        setTotalCount(res.totalCount);
      })
      .catch((e) => toast.error(errMessage(e, "Failed to load reports.")))
      .finally(() => setLoading(false));
  }, [status, reason, targetType, page]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Moderation"
        subtitle="Review and action user-filed content reports."
      />

      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatChip label="Open" value={stats.open} tone="amber" />
          <StatChip label="Under review" value={stats.underReview} tone="blue" />
          <StatChip label="Actioned / 7d" value={stats.actionedLast7d} tone="green" />
          <StatChip label="Dismissed / 7d" value={stats.dismissedLast7d} tone="gray" />
        </div>
      )}

      <Panel>
        <div className="p-4">
          <FilterBar>
            <SelectField
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
              options={STATUS_OPTS}
              placeholder="Status (Open + Under review)"
            />
            <SelectField
              value={reason}
              onChange={(v) => {
                setReason(v);
                setPage(1);
              }}
              options={REASON_OPTS}
              placeholder="Any reason"
            />
            <SelectField
              value={targetType}
              onChange={(v) => {
                setTargetType(v);
                setPage(1);
              }}
              options={TARGET_OPTS}
              placeholder="Any target"
            />
          </FilterBar>
        </div>

        {loading ? (
          <EmptyState>Loading...</EmptyState>
        ) : items.length === 0 ? (
          <EmptyState>No reports match these filters.</EmptyState>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Target</TH>
                <TH>Reason</TH>
                <TH>Details</TH>
                <TH>Reporter</TH>
                <TH>Count</TH>
                <TH>Status</TH>
                <TH>Filed</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((r) => (
                <TR key={r.id} onClick={() => navigate(adminPaths.moderationDetail(r.id))}>
                  <TD>
                    <span className="font-medium text-gray-900">{r.targetType}</span>
                    <span className="text-gray-400"> #{r.targetId}</span>
                  </TD>
                  <TD>{r.reasonName}</TD>
                  <TD className="max-w-xs truncate">{r.details ?? "—"}</TD>
                  <TD>{r.reporter?.ownerName ?? "—"}</TD>
                  <TD>{r.reportCountForTarget}</TD>
                  <TD>
                    <Tag tone={reportStatusTone(r.status)}>{r.statusName}</Tag>
                  </TD>
                  <TD className="whitespace-nowrap text-gray-500">
                    {fmtDateTime(r.createdAt)}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
        <Pagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onChange={setPage}
        />
      </Panel>
    </div>
  );
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "amber" | "blue" | "green" | "gray";
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <Tag tone={tone}>{label}</Tag>
      </div>
    </div>
  );
}
