import { Fragment, useEffect, useState } from "react";
import { toast } from "sonner";
import { getLegalVersions, publishLegalVersion, invalidateLegalCache } from "@/services/admin";
import type { LegalVersionEntry } from "@/types/admin.types";
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
  Modal,
  Field,
  SelectField,
  Textarea,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fmtDate, errMessage } from "@/lib/adminFormat";
import { RefreshCw } from "lucide-react";

const DOC_LABELS: Record<string, string> = {
  PrivacyPolicy: "Privacy Policy",
  TermsAndConditions: "Terms & Conditions",
  CommunityGuidelines: "Community Guidelines",
};

const DOC_FOLDERS: Record<string, string> = {
  PrivacyPolicy: "privacy-policy",
  TermsAndConditions: "terms-and-conditions",
  CommunityGuidelines: "community-guidelines",
};

const R2_BASE = "https://media.petaverseapp.com";

async function downloadFromR2(folder: string, version: string) {
  const r2Url = `${R2_BASE}/legal/${folder}/${version}.md`;
  const res = await fetch(r2Url);
  if (!res.ok) throw new Error(`R2 fetch failed: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${version}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

const DOC_TYPE_OPTS = [
  { value: "PrivacyPolicy", label: "Privacy Policy" },
  { value: "TermsAndConditions", label: "Terms & Conditions" },
  { value: "CommunityGuidelines", label: "Community Guidelines" },
];

const KIND_OPTS = [
  { value: "Agreement", label: 'Agreement: user clicks "I agree"' },
  { value: "Acknowledgement", label: 'Acknowledgement: user clicks "I understand"' },
];

interface PublishForm {
  documentType: string;
  version: string;
  acceptanceKind: string;
  markdownBody: string;
  effectiveAt: string;
}

const EMPTY_FORM: PublishForm = {
  documentType: "PrivacyPolicy",
  version: "",
  acceptanceKind: "Agreement",
  markdownBody: "",
  effectiveAt: "",
};

export default function LegalPage() {
  const [items, setItems] = useState<LegalVersionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishOpen, setPublishOpen] = useState(false);
  const [form, setForm] = useState<PublishForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [invalidating, setInvalidating] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getLegalVersions()
      .then(setItems)
      .catch((e) => toast.error(errMessage(e, "Failed to load legal versions.")))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openPublish = () => {
    setForm(EMPTY_FORM);
    setPublishOpen(true);
  };

  const handlePublish = async () => {
    if (!form.version.trim()) return toast.error("Version is required.");
    if (!form.markdownBody.trim()) return toast.error("Markdown body is required.");

    setSaving(true);
    try {
      const published = await publishLegalVersion({
        documentType: form.documentType,
        version: form.version.trim(),
        acceptanceKind: form.acceptanceKind,
        markdownBody: form.markdownBody,
        effectiveAt: form.effectiveAt.trim() ? new Date(form.effectiveAt).toISOString() : null,
      });
      const folder = DOC_FOLDERS[form.documentType] ?? form.documentType;
      await downloadFromR2(folder, form.version.trim());
      toast.success(
        `${DOC_LABELS[form.documentType]} v${form.version} published. Drop the downloaded file into legal/${folder}/ and commit.`,
        { duration: 8000 },
      );
      setPublishOpen(false);
      load();
    } catch (e) {
      toast.error(errMessage(e, "Publish failed."));
    } finally {
      setSaving(false);
    }
  };

  const handleInvalidate = async (documentType: string) => {
    setInvalidating(documentType);
    try {
      await invalidateLegalCache(documentType);
      toast.success(`Cache cleared for ${DOC_LABELS[documentType] ?? documentType}.`);
    } catch (e) {
      toast.error(errMessage(e, "Cache invalidation failed."));
    } finally {
      setInvalidating(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Legal documents"
        subtitle="Published versions, content hashes, and user acceptance gate. Publish new versions directly from here — no API redeploy needed."
        actions={
          <Button size="sm" onClick={openPublish}>
            Publish new version
          </Button>
        }
      />

      <Panel>
        {loading ? (
          <EmptyState>Loading...</EmptyState>
        ) : items.length === 0 ? (
          <EmptyState>No legal document versions have been published yet.</EmptyState>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Version</TH>
                <TH>Kind</TH>
                <TH>Status</TH>
                <TH>Published</TH>
                <TH>Effective</TH>
                <TH>Content hash</TH>
                <TH></TH>
              </TR>
            </THead>
            <TBody>
              {Object.entries(
                items.reduce<Record<string, LegalVersionEntry[]>>((acc, v) => {
                  (acc[v.documentType] ??= []).push(v);
                  return acc;
                }, {}),
              ).map(([docType, versions]) => (
                <Fragment key={docType}>
                  <TR>
                    <TD colSpan={7} className="bg-gray-50 py-2 font-semibold text-gray-700">
                      {DOC_LABELS[docType] ?? docType}
                    </TD>
                  </TR>
                  {versions.map((v) => (
                <TR key={v.id}>
                  <TD className="font-medium">
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {v.version}
                    </a>
                  </TD>
                  <TD className="text-gray-600">{v.acceptanceKind}</TD>
                  <TD>
                    {v.isCurrent ? (
                      <Tag tone="green">Current</Tag>
                    ) : v.isPublished ? (
                      <Tag tone="blue">Published</Tag>
                    ) : (
                      <Tag tone="gray">Draft</Tag>
                    )}
                  </TD>
                  <TD className="whitespace-nowrap text-gray-500">{fmtDate(v.publishedAt)}</TD>
                  <TD className="whitespace-nowrap text-gray-500">{fmtDate(v.effectiveAt)}</TD>
                  <TD>
                    <code className="font-mono text-xs text-gray-500" title={v.contentHash}>
                      {v.contentHash ? `${v.contentHash.slice(0, 16)}…` : "—"}
                    </code>
                  </TD>
                  <TD>
                    {v.isCurrent && (
                      <button
                        title="Invalidate 12-hour content cache"
                        disabled={invalidating === v.documentType}
                        onClick={() => handleInvalidate(v.documentType)}
                        className="text-gray-400 hover:text-gray-700 disabled:opacity-40"
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${invalidating === v.documentType ? "animate-spin" : ""}`}
                        />
                      </button>
                    )}
                  </TD>
                </TR>
                  ))}
                </Fragment>
              ))}
            </TBody>
          </Table>
        )}
      </Panel>

      {/* Publish modal */}
      <Modal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        title="Publish new version"
        wide
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setPublishOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handlePublish} disabled={saving}>
              {saving ? "Publishing…" : "Publish"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Document type">
              <SelectField
                value={form.documentType}
                onChange={(v) => setForm((f) => ({ ...f, documentType: v }))}
                options={DOC_TYPE_OPTS}
              />
            </Field>
            <Field label="Acceptance kind">
              <SelectField
                value={form.acceptanceKind}
                onChange={(v) => setForm((f) => ({ ...f, acceptanceKind: v }))}
                options={KIND_OPTS}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Version (e.g. 1.1)">
              <Input
                value={form.version}
                onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
                placeholder="1.1"
              />
            </Field>
            <Field label="Effective at (optional, UTC)">
              <Input
                type="datetime-local"
                value={form.effectiveAt}
                onChange={(e) => setForm((f) => ({ ...f, effectiveAt: e.target.value }))}
              />
            </Field>
          </div>

          <Field label="Markdown body (frontmatter-stripped)">
            <Textarea
              value={form.markdownBody}
              onChange={(v) => setForm((f) => ({ ...f, markdownBody: v }))}
              placeholder="# Privacy Policy&#10;&#10;Last updated: …"
              rows={20}
            />
          </Field>

          <p className="text-xs text-gray-500">
            Paste the document body without YAML frontmatter. The content is uploaded to R2 and
            immediately available — no API redeploy needed. A SHA-256 hash of the body is stored in
            the database and shown in this table. Users who accepted an older version will be prompted
            to re-accept on next app open.
          </p>
        </div>
      </Modal>
    </div>
  );
}
