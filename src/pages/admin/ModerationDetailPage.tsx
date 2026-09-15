import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import {
  getModerationReport,
  claimReport,
  resolveReport,
} from "@/services/admin";
import type {
  ReportDetail,
  ReportTarget,
  ResolveReportRequest,
  ReportDecision,
  ContentAction,
  UserActionKind,
} from "@/types/admin.types";
import {
  PageHeader,
  Panel,
  Tag,
  Modal,
  Field,
  SelectField,
  Textarea,
  TextField,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { ROUTES, adminPaths } from "@/constants/routes";
import { fmtDateTime, reportStatusTone, errMessage } from "@/lib/adminFormat";

export default function ModerationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    getModerationReport(Number(id))
      .then(setReport)
      .catch((e) => toast.error(errMessage(e, "Failed to load report.")))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const onClaim = async () => {
    if (!report) return;
    setClaiming(true);
    try {
      const updated = await claimReport(report.id);
      setReport(updated);
      toast.success("Claimed. Now under review.");
    } catch (e) {
      toast.error(errMessage(e, "Failed to claim."));
    } finally {
      setClaiming(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-400">Loading...</p>;
  if (!report) return <p className="text-sm text-gray-400">Report not found.</p>;

  const isTerminal = report.status === 2 || report.status === 3;

  return (
    <div className="space-y-6">
      <Link
        to={ROUTES.ADMIN_MODERATION}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to queue
      </Link>

      <PageHeader
        title={`Report #${report.id}`}
        subtitle={
          <span className="flex items-center gap-2">
            <Tag tone={reportStatusTone(report.status)}>{report.statusName}</Tag>
            <span>
              {report.targetType} #{report.targetId} : {report.reasonName}
            </span>
          </span>
        }
        actions={
          <>
            {report.status === 0 && (
              <Button variant="outline" size="sm" onClick={onClaim} disabled={claiming}>
                {claiming ? "Claiming..." : "Claim"}
              </Button>
            )}
            {!isTerminal && (
              <Button size="sm" onClick={() => setResolveOpen(true)}>
                Resolve
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel className="p-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Reported content</h3>
            <TargetView target={report.target} />
          </Panel>

          {report.relatedReports.length > 0 && (
            <Panel className="p-6">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">
                Related reports on this target ({report.relatedReports.length})
              </h3>
              <ul className="space-y-2 text-sm">
                {report.relatedReports.map((rr) => (
                  <li key={rr.id} className="flex items-center justify-between">
                    <span className="text-gray-700">
                      #{rr.id} : {rr.reasonName}
                    </span>
                    <span className="text-gray-400">{fmtDateTime(rr.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <div className="space-y-6">
          <Panel className="p-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Report</h3>
            <dl className="space-y-3 text-sm">
              <Row label="Reason">{report.reasonName}</Row>
              <Row label="Details">{report.details ?? "—"}</Row>
              <Row label="Reports on target">{report.reportCountForTarget}</Row>
              <Row label="Filed">{fmtDateTime(report.createdAt)}</Row>
              <Row label="Updated">{fmtDateTime(report.updatedAt)}</Row>
            </dl>
          </Panel>

          <Panel className="p-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Reporter</h3>
            <dl className="space-y-3 text-sm">
              <Row label="Pet">
                {report.reporter?.petName} (#{report.reporter?.petId})
              </Row>
              <Row label="Owner">
                {report.reporter?.ownerUserId ? (
                  <Link
                    to={adminPaths.userDetail(report.reporter.ownerUserId)}
                    className="text-paw-orange hover:underline"
                  >
                    {report.reporter.ownerName}
                  </Link>
                ) : (
                  report.reporter?.ownerName ?? "—"
                )}
              </Row>
            </dl>
          </Panel>
        </div>
      </div>

      <ResolveModal
        open={resolveOpen}
        onClose={() => setResolveOpen(false)}
        report={report}
        onResolved={(updated) => {
          setReport(updated);
          setResolveOpen(false);
          toast.success("Report resolved.");
        }}
      />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-400">{label}</dt>
      <dd className="text-gray-800">{children}</dd>
    </div>
  );
}

function TargetView({ target }: { target: ReportTarget | null }) {
  if (!target) {
    return <p className="text-sm text-gray-400">Target no longer exists.</p>;
  }

  if (target.kind === "pet") {
    return (
      <div className="flex items-center gap-4">
        {target.avatarUrl ? (
          <img
            src={target.avatarUrl}
            alt={target.name}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-gray-100" />
        )}
        <div>
          <p className="font-medium text-gray-900">{target.name}</p>
          <p className="text-sm text-gray-500">Pet #{target.id}</p>
          <Link
            to={adminPaths.userDetail(target.ownerUserId)}
            className="text-sm text-paw-orange hover:underline"
          >
            View owner
          </Link>
        </div>
      </div>
    );
  }

  // post or comment
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
        <span className="font-medium text-gray-900">{target.authorPetName}</span>
        <span>:</span>
        <span>{target.kind === "post" ? "Post" : "Comment"} #{target.id}</span>
        {target.isDeleted && <Tag tone="red">Deleted</Tag>}
      </div>
      <p className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-800">
        {target.text || "(no text)"}
      </p>
      {target.kind === "post" && target.media.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {target.media.map((m) => (
            <img
              key={m}
              src={m}
              alt=""
              className="h-24 w-24 rounded-lg object-cover"
            />
          ))}
        </div>
      )}
      <p className="mt-2 text-xs text-gray-400">{fmtDateTime(target.createdAt)}</p>
    </div>
  );
}

const DECISION_OPTS = [
  { value: "action_taken", label: "Action taken" },
  { value: "dismissed", label: "Dismissed" },
];
const CONTENT_OPTS = [
  { value: "remove", label: "Remove content" },
  { value: "none", label: "Leave content" },
];
const USER_ACTION_OPTS = [
  { value: "none", label: "No user action" },
  { value: "warn", label: "Warn" },
  { value: "suspend", label: "Suspend" },
  { value: "ban", label: "Ban" },
];

function ResolveModal({
  open,
  onClose,
  report,
  onResolved,
}: {
  open: boolean;
  onClose: () => void;
  report: ReportDetail;
  onResolved: (r: ReportDetail) => void;
}) {
  const [decision, setDecision] = useState<ReportDecision>("action_taken");
  const [contentAction, setContentAction] = useState<ContentAction>("remove");
  const [userAction, setUserAction] = useState<UserActionKind>("none");
  const [suspendDays, setSuspendDays] = useState("7");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isPetTarget = report.target?.kind === "pet";

  const submit = async () => {
    const body: ResolveReportRequest = { decision, note: note || undefined };
    if (decision === "action_taken") {
      body.contentAction = contentAction;
      body.userAction = userAction;
      if (userAction === "suspend") {
        const days = Number(suspendDays);
        if (!days || days < 1) {
          toast.error("Suspend requires at least 1 day.");
          return;
        }
        body.suspendDays = days;
      }
    }
    setSubmitting(true);
    try {
      const updated = await resolveReport(report.id, body);
      onResolved(updated);
    } catch (e) {
      toast.error(errMessage(e, "Failed to resolve."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Resolve report #${report.id}`}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={submitting}>
            {submitting ? "Resolving..." : "Confirm"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Decision">
          <SelectField
            value={decision}
            onChange={(v) => setDecision(v as ReportDecision)}
            options={DECISION_OPTS}
            className="w-full"
          />
        </Field>

        {decision === "action_taken" && (
          <>
            <Field label="Content action">
              <SelectField
                value={contentAction}
                onChange={(v) => setContentAction(v as ContentAction)}
                options={CONTENT_OPTS}
                className="w-full"
              />
              {isPetTarget && contentAction === "remove" && (
                <p className="mt-1 text-xs text-amber-600">
                  Pet targets have no soft-delete; content removal is a no-op. Act on
                  the owner below.
                </p>
              )}
            </Field>

            <Field label="User action (on content author's owner)">
              <SelectField
                value={userAction}
                onChange={(v) => setUserAction(v as UserActionKind)}
                options={USER_ACTION_OPTS}
                className="w-full"
              />
            </Field>

            {userAction === "suspend" && (
              <Field label="Suspend days">
                <TextField
                  type="number"
                  value={suspendDays}
                  onChange={setSuspendDays}
                  className="w-full"
                />
              </Field>
            )}
          </>
        )}

        <Field label="Internal note">
          <Textarea
            value={note}
            onChange={setNote}
            placeholder="Recorded on the audit log."
          />
        </Field>
      </div>
    </Modal>
  );
}
