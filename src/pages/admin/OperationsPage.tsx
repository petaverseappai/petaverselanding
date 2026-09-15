import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Play, RefreshCw } from "lucide-react";
import { getJobs, triggerJob, getHealth } from "@/services/admin";
import type { RecurringJob, HealthResponse } from "@/types/admin.types";
import { TRIGGERABLE_JOBS } from "@/types/admin.types";
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
  EmptyState,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { fmtDateTime, jobResultTone, healthTone, errMessage } from "@/lib/adminFormat";

const triggerable = new Set<string>(TRIGGERABLE_JOBS);

export default function OperationsPage() {
  const [jobs, setJobs] = useState<RecurringJob[]>([]);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([getJobs(), getHealth()])
      .then(([j, h]) => {
        setJobs(j);
        setHealth(h);
      })
      .catch((e) => toast.error(errMessage(e, "Failed to load operations.")))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const onTrigger = async (name: string) => {
    setTriggering(name);
    try {
      await triggerJob(name);
      toast.success(`Triggered "${name}".`);
    } catch (e) {
      toast.error(errMessage(e, "Failed to trigger job."));
    } finally {
      setTriggering(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations"
        subtitle="Background jobs and system health."
        actions={
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        }
      />

      <Panel className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Health</h3>
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : !health ? (
          <p className="text-sm text-gray-400">No data.</p>
        ) : (
          <div>
            <div className="mb-4">
              <Tag tone={health.status === "Healthy" ? "green" : "red"}>{health.status}</Tag>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {Object.entries(health.checks).map(([name, value]) => (
                <div
                  key={name}
                  className="rounded-xl border border-gray-100 p-3 text-center"
                >
                  <p className="text-xs text-gray-500">{name}</p>
                  <div className="mt-1">
                    <Tag tone={healthTone(value)}>{value}</Tag>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>

      <Panel>
        <h3 className="px-6 pt-6 text-sm font-semibold text-gray-900">Recurring jobs</h3>
        {loading ? (
          <EmptyState>Loading...</EmptyState>
        ) : jobs.length === 0 ? (
          <EmptyState>No jobs.</EmptyState>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Job</TH>
                <TH>Cron</TH>
                <TH>Last run</TH>
                <TH>Result</TH>
                <TH>Next run</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {jobs.map((j) => (
                <TR key={j.id}>
                  <TD className="font-medium text-gray-900">{j.name}</TD>
                  <TD className="font-mono text-xs text-gray-500">{j.cron}</TD>
                  <TD className="whitespace-nowrap text-gray-500">
                    {fmtDateTime(j.lastExecution)}
                  </TD>
                  <TD>
                    {j.lastResult ? (
                      <Tag tone={jobResultTone(j.lastResult)}>{j.lastResult}</Tag>
                    ) : (
                      "—"
                    )}
                  </TD>
                  <TD className="whitespace-nowrap text-gray-500">
                    {fmtDateTime(j.nextExecution)}
                  </TD>
                  <TD>
                    {triggerable.has(j.name) && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={triggering === j.name}
                        onClick={() => onTrigger(j.name)}
                      >
                        <Play className="h-4 w-4" />
                        {triggering === j.name ? "..." : "Trigger"}
                      </Button>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Panel>
    </div>
  );
}
