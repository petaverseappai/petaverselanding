import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import {
  getCommunity,
  archiveCommunity,
  reassignCommunityOwner,
} from "@/services/admin";
import type { CommunityDetail } from "@/types/admin.types";
import {
  PageHeader,
  Panel,
  Tag,
  Modal,
  Field,
  TextField,
  ConfirmModal,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { ROUTES, adminPaths } from "@/constants/routes";
import { fmtDateTime, errMessage } from "@/lib/adminFormat";

export default function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    getCommunity(Number(id))
      .then(setCommunity)
      .catch((e) => toast.error(errMessage(e, "Failed to load community.")))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const onArchive = async () => {
    if (!community) return;
    setBusy(true);
    try {
      await archiveCommunity(community.id);
      toast.success("Community archived.");
      load();
    } catch (e) {
      toast.error(errMessage(e, "Failed to archive."));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-400">Loading...</p>;
  if (!community) return <p className="text-sm text-gray-400">Community not found.</p>;

  return (
    <div className="space-y-6">
      <Link
        to={ROUTES.ADMIN_COMMUNITIES}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to communities
      </Link>

      <PageHeader
        title={community.name}
        subtitle={
          <span className="flex items-center gap-2">
            <span>@{community.handle}</span>
            <Tag tone="blue">{community.category}</Tag>
            {community.isDeleted ? (
              <Tag tone="red">Archived</Tag>
            ) : (
              <Tag tone="green">Active</Tag>
            )}
          </span>
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setReassignOpen(true)}>
              Reassign lead
            </Button>
            {!community.isDeleted && (
              <Button variant="outline" size="sm" disabled={busy} onClick={() => setArchiveOpen(true)}>
                Archive
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel className="p-6 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">About</h3>
          <p className="whitespace-pre-wrap text-sm text-gray-700">
            {community.description || "No description."}
          </p>
        </Panel>

        <Panel className="p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Details</h3>
          <dl className="space-y-3 text-sm">
            <Row label="Members">{community.memberCount}</Row>
            <Row label="Posts">{community.postCount}</Row>
            <Row label="Lead pet">
              {community.leadPetName} (#{community.leadPetId})
            </Row>
            <Row label="Lead owner">
              <Link
                to={adminPaths.userDetail(community.leadOwnerUserId)}
                className="text-paw-orange hover:underline"
              >
                View owner
              </Link>
            </Row>
            <Row label="Created">{fmtDateTime(community.createdAt)}</Row>
          </dl>
        </Panel>
      </div>

      <ConfirmModal
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onConfirm={onArchive}
        title="Archive community"
        message={`Archive "${community.name}"? It will be hidden from the directory.`}
        confirmLabel="Archive"
        danger
      />

      <ReassignModal
        open={reassignOpen}
        onClose={() => setReassignOpen(false)}
        onSubmit={async (petId) => {
          try {
            await reassignCommunityOwner(community.id, petId);
            toast.success("Lead reassigned.");
            setReassignOpen(false);
            load();
          } catch (e) {
            toast.error(errMessage(e, "Failed to reassign."));
          }
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

function ReassignModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (petId: number) => Promise<void>;
}) {
  const [petId, setPetId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setPetId("");
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reassign community lead"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={saving}
            onClick={async () => {
              const n = Number(petId);
              if (!n) {
                toast.error("Enter a valid pet ID.");
                return;
              }
              setSaving(true);
              await onSubmit(n);
              setSaving(false);
            }}
          >
            {saving ? "Saving..." : "Reassign"}
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-gray-500">
        A community's lead is a pet, not a user. Enter the new lead pet's ID.
      </p>
      <Field label="New lead pet ID">
        <TextField type="number" value={petId} onChange={setPetId} className="w-full" />
      </Field>
    </Modal>
  );
}
