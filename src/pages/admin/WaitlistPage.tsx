import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { getAdminWaitlist, downloadWaitlistCsv } from "@/services/admin";
import type { WaitlistEntry } from "@/types/admin.types";
import {
  PageHeader,
  Panel,
  Table,
  THead,
  TBody,
  TH,
  TR,
  TD,
  Pagination,
  EmptyState,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { fmtDateTime, errMessage } from "@/lib/adminFormat";

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAdminWaitlist({ page, pageSize: 20 })
      .then((res) => {
        setEntries(res.items);
        setTotalPages(res.totalPages);
        setTotalCount(res.totalCount);
      })
      .catch((e) => toast.error(errMessage(e, "Failed to load waitlist.")))
      .finally(() => setLoading(false));
  }, [page]);

  const onExport = async () => {
    setExporting(true);
    try {
      const blob = await downloadWaitlistCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "waitlist.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(errMessage(e, "Export failed."));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Waitlist"
        subtitle={loading ? "Loading..." : `${totalCount.toLocaleString()} total signup(s)`}
        actions={
          <Button variant="outline" size="sm" onClick={onExport} disabled={exporting}>
            <Download className="h-4 w-4" />
            {exporting ? "Exporting..." : "Export CSV"}
          </Button>
        }
      />

      <Panel>
        {loading ? (
          <EmptyState>Loading...</EmptyState>
        ) : entries.length === 0 ? (
          <EmptyState>No entries yet.</EmptyState>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH className="w-16">#</TH>
                <TH>Email</TH>
                <TH>Joined</TH>
              </TR>
            </THead>
            <TBody>
              {entries.map((e) => (
                <TR key={e.id}>
                  <TD className="text-gray-400">{e.id}</TD>
                  <TD className="text-gray-900">{e.email}</TD>
                  <TD className="text-gray-500">{fmtDateTime(e.joinedAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
        <Pagination page={page} totalPages={totalPages} totalCount={totalCount} onChange={setPage} />
      </Panel>
    </div>
  );
}
