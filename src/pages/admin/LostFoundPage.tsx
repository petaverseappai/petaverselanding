import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getLostFoundReports, resolveLostFound, removeLostFound } from "@/services/admin";
import type { LostFoundReport } from "@/types/admin.types";
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
  ConfirmModal,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { fmtDate, errMessage } from "@/lib/adminFormat";

const TYPE_OPTS = [
  { value: "lost", label: "Lost" },
  { value: "found", label: "Found" },
];
const STATUS_OPTS = [
  { value: "active", label: "Active" },
  { value: "resolved", label: "Resolved" },
];

export default function LostFoundPage() {
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<LostFoundReport[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmReport, setConfirmReport] = useState<LostFoundReport | null>(null);

  const load = () => {
    setLoading(true);
    getLostFoundReports({
      type: (type || undefined) as "lost" | "found" | undefined,
      status: (status || undefined) as "active" | "resolved" | undefined,
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
  };

  useEffect(() => {
    setPage(1);
  }, [type, status]);

  useEffect(load, [type, status, page]);

  const doResolve = async (r: LostFoundReport) => {
    setBusyId(r.id);
    try {
      await resolveLostFound(r.id);
      toast.success("Marked resolved.");
      load();
    } catch (e) {
      toast.error(errMessage(e, "Failed to resolve."));
    } finally {
      setBusyId(null);
    }
  };

  const doRemove = async (r: LostFoundReport) => {
    setBusyId(r.id);
    try {
      await removeLostFound(r.id);
      toast.success("Report removed.");
      load();
    } catch (e) {
      toast.error(errMessage(e, "Failed to remove."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Lost & Found" subtitle="Manage lost and found pet reports." />

      <Panel>
        <div className="p-4">
          <FilterBar>
            <SelectField value={type} onChange={setType} options={TYPE_OPTS} placeholder="Any type" />
            <SelectField
              value={status}
              onChange={setStatus}
              options={STATUS_OPTS}
              placeholder="Any status"
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
                <TH>Pet</TH>
                <TH>Type</TH>
                <TH>Reporter</TH>
                <TH>Status</TH>
                <TH>Reward</TH>
                <TH>Last seen</TH>
                <TH>Created</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {items.map((r) => (
                <TR key={r.id}>
                  <TD className="font-medium text-gray-900">{r.petName}</TD>
                  <TD>
                    <Tag tone={r.type === "lost" ? "amber" : "blue"}>{r.type}</Tag>
                  </TD>
                  <TD>{r.reporterName}</TD>
                  <TD>
                    <Tag tone="gray">{r.statusName}</Tag>
                  </TD>
                  <TD>{r.reward != null ? r.reward : "—"}</TD>
                  <TD className="max-w-[12rem] truncate">{r.lastSeenAddress ?? "—"}</TD>
                  <TD className="whitespace-nowrap text-gray-500">{fmtDate(r.createdAt)}</TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      {!r.resolvedAt && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busyId === r.id}
                          onClick={() => doResolve(r)}
                        >
                          Resolve
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busyId === r.id}
                        onClick={() => setConfirmReport(r)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
        <Pagination page={page} totalPages={totalPages} totalCount={totalCount} onChange={setPage} />
      </Panel>

      <ConfirmModal
        open={confirmReport !== null}
        onClose={() => setConfirmReport(null)}
        onConfirm={() => confirmReport && doRemove(confirmReport)}
        title="Remove report"
        message={`Permanently remove the report for "${confirmReport?.petName}"? This cannot be undone.`}
        confirmLabel="Remove"
        danger
      />
    </div>
  );
}
