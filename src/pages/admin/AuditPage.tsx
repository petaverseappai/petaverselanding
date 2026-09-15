import { Fragment, useEffect, useState } from "react";
import { toast } from "sonner";
import { getAuditLog } from "@/services/admin";
import type { AuditEntry } from "@/types/admin.types";
import { AUDIT_ACTIONS } from "@/types/admin.types";
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
  TextField,
  SelectField,
} from "@/components/admin/ui";
import { fmtDateTime, errMessage } from "@/lib/adminFormat";
import { useDebounced } from "@/lib/useDebounced";

const ACTION_OPTS = AUDIT_ACTIONS.map((a) => ({ value: a, label: a }));

export default function AuditPage() {
  const [action, setAction] = useState("");
  const [actorUserId, setActorUserId] = useState("");
  const [targetType, setTargetType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const debouncedActor = useDebounced(actorUserId, 350);
  const debouncedTarget = useDebounced(targetType, 350);
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<AuditEntry[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    setPage(1);
  }, [action, debouncedActor, debouncedTarget, from, to]);

  useEffect(() => {
    setLoading(true);
    getAuditLog({
      action: action || undefined,
      actorUserId: debouncedActor || undefined,
      targetType: debouncedTarget || undefined,
      from: from ? new Date(from).toISOString() : undefined,
      to: to ? new Date(to).toISOString() : undefined,
      page,
      pageSize: 20,
    })
      .then((res) => {
        setItems(res.items);
        setTotalPages(res.totalPages);
        setTotalCount(res.totalCount);
      })
      .catch((e) => toast.error(errMessage(e, "Failed to load audit log.")))
      .finally(() => setLoading(false));
  }, [action, debouncedActor, debouncedTarget, from, to, page]);

  return (
    <div className="space-y-6">
      <PageHeader title="Audit log" subtitle="Every mutating admin action." />

      <Panel>
        <div className="p-4">
          <FilterBar>
            <SelectField
              value={action}
              onChange={setAction}
              options={ACTION_OPTS}
              placeholder="Any action"
            />
            <TextField
              value={actorUserId}
              onChange={setActorUserId}
              placeholder="Actor user ID"
              className="w-48"
            />
            <TextField
              value={targetType}
              onChange={setTargetType}
              placeholder="Target type"
              className="w-40"
            />
            <TextField type="date" value={from} onChange={setFrom} className="w-40" />
            <TextField type="date" value={to} onChange={setTo} className="w-40" />
          </FilterBar>
        </div>

        {loading ? (
          <EmptyState>Loading...</EmptyState>
        ) : items.length === 0 ? (
          <EmptyState>No audit entries match these filters.</EmptyState>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>When</TH>
                <TH>Actor</TH>
                <TH>Action</TH>
                <TH>Target</TH>
                <TH>Summary</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((a) => (
                <Fragment key={a.id}>
                  <TR
                    onClick={() =>
                      a.metadata ? setExpanded(expanded === a.id ? null : a.id) : undefined
                    }
                  >
                    <TD className="whitespace-nowrap text-gray-500">
                      {fmtDateTime(a.createdAt)}
                    </TD>
                    <TD>{a.actor?.name ?? "—"}</TD>
                    <TD>
                      <Tag tone="blue">{a.action}</Tag>
                    </TD>
                    <TD className="text-gray-600">
                      {a.targetType}
                      {a.targetId ? ` #${a.targetId}` : ""}
                    </TD>
                    <TD>{a.summary}</TD>
                  </TR>
                  {expanded === a.id && a.metadata && (
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="px-6 py-3">
                        <pre className="overflow-x-auto rounded-lg bg-white p-3 text-xs text-gray-700">
                          {JSON.stringify(a.metadata, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </TBody>
          </Table>
        )}
        <Pagination page={page} totalPages={totalPages} totalCount={totalCount} onChange={setPage} />
      </Panel>
    </div>
  );
}
