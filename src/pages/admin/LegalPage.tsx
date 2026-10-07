import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getLegalVersions } from "@/services/admin";
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
} from "@/components/admin/ui";
import { fmtDate, errMessage } from "@/lib/adminFormat";

const DOC_LABELS: Record<string, string> = {
  PrivacyPolicy: "Privacy Policy",
  TermsAndConditions: "Terms & Conditions",
  CommunityGuidelines: "Community Guidelines",
};

export default function LegalPage() {
  const [items, setItems] = useState<LegalVersionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLegalVersions()
      .then(setItems)
      .catch((e) => toast.error(errMessage(e, "Failed to load legal versions.")))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Legal documents"
        subtitle="Published versions and their content hashes. Document text is version-controlled in Git and rendered on the public site; this view is read-only."
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
                <TH>Document</TH>
                <TH>Version</TH>
                <TH>Kind</TH>
                <TH>Status</TH>
                <TH>Published</TH>
                <TH>Effective</TH>
                <TH>Content hash (SHA-256)</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((v) => (
                <TR key={v.id}>
                  <TD>{DOC_LABELS[v.documentType] ?? v.documentType}</TD>
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
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Panel>
    </div>
  );
}
