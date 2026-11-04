import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Upload, Trash2 } from "lucide-react";
import {
  getCommunity,
  updateCommunity,
  deleteCommunity,
  restoreCommunity,
  getCommunityContent,
  removeCommunityContent,
  getUploadUrlForCommunity,
  confirmUpload,
} from "@/services/admin";
import type { CommunityDetail, CommunityContentItem } from "@/types/admin.types";
import { COMMUNITY_CATEGORIES } from "@/types/admin.types";
import { MediaCategory } from "@/constants/mediaCategory";
import { compressImage } from "@/lib/imageCompressor";
import {
  PageHeader,
  Panel,
  Tag,
  Modal,
  Field,
  TextField,
  SelectField,
  Textarea,
  ConfirmModal,
  LoadingState,
  Table,
  THead,
  TBody,
  TH,
  TR,
  TD,
  EmptyState,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { fmtDate, fmtDateTime, fmtNumber, errMessage } from "@/lib/adminFormat";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Image upload helper
// ---------------------------------------------------------------------------

async function uploadImage(file: File, category: number): Promise<string> {
  const compressed = await compressImage(file, category);
  const { assetId, uploadUrl, contentType } = await getUploadUrlForCommunity(
    compressed.type || file.type,
    file.name,
    compressed.size,
    category,
  );
  await fetch(uploadUrl, {
    method: "PUT",
    body: compressed,
    headers: { "Content-Type": contentType },
  });
  await confirmUpload(assetId);
  return assetId;
}

// ---------------------------------------------------------------------------
// ImageUploadField
// ---------------------------------------------------------------------------

function ImageUploadField({
  label,
  currentUrl,
  onAssetId,
  aspect = "square",
}: {
  label: string;
  currentUrl: string | null;
  onAssetId: (id: string | null) => void;
  aspect?: "square" | "banner";
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const category =
    aspect === "banner" ? MediaCategory.CommunityBanner : MediaCategory.CommunityAvatar;

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const id = await uploadImage(file, category);
      setPreview(URL.createObjectURL(file));
      onAssetId(id);
    } catch (e) {
      toast.error(errMessage(e, "Upload failed."));
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = preview ?? currentUrl;

  return (
    <Field label={label}>
      <div className="mt-1 flex items-center gap-3">
        {displayUrl ? (
          <img
            src={displayUrl}
            alt=""
            className={cn(
              "object-cover",
              aspect === "banner"
                ? "h-16 w-32 rounded-lg"
                : "h-12 w-12 rounded-full",
            )}
          />
        ) : (
          <div
            className={cn(
              "flex items-center justify-center rounded-lg bg-gray-100 text-gray-400",
              aspect === "banner" ? "h-16 w-32" : "h-12 w-12 rounded-full",
            )}
          >
            <Upload className="h-4 w-4" />
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => ref.current?.click()}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : displayUrl ? "Change" : "Upload"}
          </button>
          {displayUrl && (
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                onAssetId("00000000-0000-0000-0000-000000000000");
              }}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Remove
            </button>
          )}
        </div>
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
    </Field>
  );
}

// ---------------------------------------------------------------------------
// Row helper
// ---------------------------------------------------------------------------

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-800">{children}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit modal
// ---------------------------------------------------------------------------

function EditModal({
  open,
  community,
  onClose,
  onSaved,
}: {
  open: boolean;
  community: CommunityDetail;
  onClose: () => void;
  onSaved: (c: CommunityDetail) => void;
}) {
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [leadPetId, setLeadPetId] = useState("");
  const [avatarAssetId, setAvatarAssetId] = useState<string | null>(null);
  const [bannerAssetId, setBannerAssetId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(community.name);
      setHandle(community.handle ?? "");
      setDescription(community.description ?? "");
      setCategory("");
      setLeadPetId(community.leadPetId != null ? String(community.leadPetId) : "");
      setAvatarAssetId(null);
      setBannerAssetId(null);
    }
  }, [open, community]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (name !== community.name) body.name = name;
      if (handle !== (community.handle ?? "")) body.handle = handle;
      if (description !== (community.description ?? "")) body.description = description;
      if (category) body.category = Number(category);

      const parsedLead = leadPetId === "" ? undefined : Number(leadPetId);
      if (parsedLead !== undefined && parsedLead !== community.leadPetId) {
        body.leadPetId = parsedLead;
      }
      if (avatarAssetId !== null) body.avatarAssetId = avatarAssetId;
      if (bannerAssetId !== null) body.bannerAssetId = bannerAssetId;

      const updated = await updateCommunity(community.id, body);
      toast.success("Community updated.");
      onSaved(updated);
      onClose();
    } catch (e) {
      toast.error(errMessage(e, "Failed to update community."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit community"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={saving} onClick={handleSave}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name">
          <TextField value={name} onChange={setName} className="w-full" />
        </Field>
        <Field label="Handle">
          <TextField value={handle} onChange={setHandle} placeholder="lowercase-with-hyphens" className="w-full" />
        </Field>
        <Field label="Description">
          <Textarea value={description} onChange={setDescription} rows={3} className="w-full" />
        </Field>
        <Field label="Category">
          <SelectField
            value={category}
            onChange={setCategory}
            options={COMMUNITY_CATEGORIES}
            placeholder={`Current: ${community.category}`}
            className="w-full"
          />
        </Field>
        <Field label="Lead pet ID (0 to clear, blank to keep)">
          <TextField
            type="number"
            value={leadPetId}
            onChange={setLeadPetId}
            placeholder="Pet ID"
            className="w-full"
          />
        </Field>
        <ImageUploadField
          label="Avatar"
          currentUrl={community.avatarUrl}
          onAssetId={setAvatarAssetId}
          aspect="square"
        />
        <ImageUploadField
          label="Banner"
          currentUrl={community.bannerUrl}
          onAssetId={setBannerAssetId}
          aspect="banner"
        />
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Content tab
// ---------------------------------------------------------------------------

const CONTENT_TYPE_OPTS = [
  { value: "post", label: "Posts" },
  { value: "event", label: "Events" },
  { value: "poll", label: "Polls" },
];

function ContentTab({ communityId }: { communityId: number }) {
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<CommunityContentItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmItem, setConfirmItem] = useState<CommunityContentItem | null>(null);
  const [removing, setRemoving] = useState(false);

  const load = () => {
    setLoading(true);
    getCommunityContent(communityId, {
      type: typeFilter || undefined,
      page,
      pageSize: 20,
    })
      .then((res) => {
        setItems(res.items);
        setTotalCount(res.totalCount);
        setHasMore(res.hasMore);
      })
      .catch((e) => toast.error(errMessage(e, "Failed to load content.")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
  }, [typeFilter]);

  useEffect(() => {
    load();
  }, [communityId, typeFilter, page]);

  const handleRemove = async () => {
    if (!confirmItem) return;
    setRemoving(true);
    try {
      await removeCommunityContent(communityId, confirmItem.type, confirmItem.id);
      toast.success("Content removed.");
      setConfirmItem(null);
      load();
    } catch (e) {
      toast.error(errMessage(e, "Failed to remove content."));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <SelectField
          value={typeFilter}
          onChange={(v) => setTypeFilter(v)}
          options={CONTENT_TYPE_OPTS}
          placeholder="All types"
          className="w-40"
        />
        <span className="text-xs text-gray-400">{totalCount} total</span>
      </div>

      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState>No content in this community.</EmptyState>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Type</TH>
              <TH>Author</TH>
              <TH>Content</TH>
              <TH>Status</TH>
              <TH>Created</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {items.map((item) => (
              <TR key={`${item.type}-${item.id}`}>
                <TD>
                  <Tag tone={item.type === "post" ? "blue" : item.type === "event" ? "orange" : "gray"}>
                    {item.type}
                  </Tag>
                </TD>
                <TD className="text-gray-700">{item.authorPetName}</TD>
                <TD className="max-w-xs">
                  <p className="truncate text-sm text-gray-700">
                    {item.title ?? item.body ?? "—"}
                  </p>
                </TD>
                <TD>
                  {item.isDeleted ? (
                    <Tag tone="red">Deleted</Tag>
                  ) : (
                    <Tag tone="green">Active</Tag>
                  )}
                </TD>
                <TD className="whitespace-nowrap text-gray-500">{fmtDate(item.createdAt)}</TD>
                <TD>
                  {!item.isDeleted && (
                    <button
                      onClick={() => setConfirmItem(item)}
                      className="rounded p-1 text-gray-400 hover:text-red-600"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      {(hasMore || page > 1) && (
        <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
          <span>{totalCount} total</span>
          <div className="flex gap-2">
            {page > 1 && (
              <button
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50"
              >
                Prev
              </button>
            )}
            {hasMore && (
              <button
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50"
              >
                Next
              </button>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmItem !== null}
        onClose={() => setConfirmItem(null)}
        onConfirm={handleRemove}
        title="Remove content"
        message={`Remove this ${confirmItem?.type ?? "item"}? It will be soft-deleted.`}
        confirmLabel={removing ? "Removing..." : "Remove"}
        danger
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type Tab = "details" | "content";

export default function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("details");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
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

  const handleDelete = async () => {
    if (!community) return;
    setBusy(true);
    try {
      await deleteCommunity(community.id);
      toast.success("Community deleted.");
      load();
    } catch (e) {
      toast.error(errMessage(e, "Failed to delete community."));
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    if (!community) return;
    setBusy(true);
    try {
      await restoreCommunity(community.id);
      toast.success("Community restored.");
      load();
    } catch (e) {
      toast.error(errMessage(e, "Failed to restore community."));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingState />;
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
          <span className="flex flex-wrap items-center gap-2">
            {community.handle && <span>@{community.handle}</span>}
            <Tag tone={community.isSystem ? "orange" : "blue"}>{community.category}</Tag>
            {community.isSystem && <Tag tone="gray">System</Tag>}
            {community.isDeleted ? (
              <Tag tone="red">Deleted</Tag>
            ) : (
              <Tag tone="green">Active</Tag>
            )}
          </span>
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            {community.isDeleted ? (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => setRestoreOpen(true)}
              >
                Restore
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => setDeleteOpen(true)}
              >
                Delete
              </Button>
            )}
          </>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(["details", "content"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-sm font-medium capitalize",
              tab === t
                ? "border-b-2 border-paw-orange text-paw-orange"
                : "text-gray-500 hover:text-gray-900",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "details" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Banner + About */}
          <div className="space-y-4 lg:col-span-2">
            {community.bannerUrl && (
              <Panel>
                <img
                  src={community.bannerUrl}
                  alt="Banner"
                  className="h-40 w-full rounded-2xl object-cover"
                />
              </Panel>
            )}
            <Panel className="p-6">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">About</h3>
              <p className="whitespace-pre-wrap text-sm text-gray-700">
                {community.description || "No description."}
              </p>
            </Panel>
          </div>

          {/* Sidebar */}
          <Panel className="p-6">
            <div className="mb-4 flex items-center gap-3">
              {community.avatarUrl && (
                <img
                  src={community.avatarUrl}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover"
                />
              )}
              <h3 className="text-sm font-semibold text-gray-900">Details</h3>
            </div>
            <dl className="space-y-3 text-sm">
              <Row label="Members">{fmtNumber(community.memberCount)}</Row>
              <Row label="Posts">{fmtNumber(community.postCount)}</Row>
              {community.speciesName && (
                <Row label="Species">{community.speciesName}</Row>
              )}
              <Row label="Lead pet">
                {community.leadPetName
                  ? `${community.leadPetName} (#${community.leadPetId})`
                  : "—"}
              </Row>
              {community.leadPetOwnerName && (
                <Row label="Lead owner">{community.leadPetOwnerName}</Row>
              )}
              <Row label="Created">{fmtDateTime(community.createdAt)}</Row>
            </dl>
          </Panel>
        </div>
      )}

      {tab === "content" && (
        <Panel className="p-6">
          <ContentTab communityId={community.id} />
        </Panel>
      )}

      <EditModal
        open={editOpen}
        community={community}
        onClose={() => setEditOpen(false)}
        onSaved={setCommunity}
      />

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete community"
        message={`Delete "${community.name}"? It will be soft-deleted and hidden from the directory.`}
        confirmLabel="Delete"
        danger
      />

      <ConfirmModal
        open={restoreOpen}
        onClose={() => setRestoreOpen(false)}
        onConfirm={handleRestore}
        title="Restore community"
        message={`Restore "${community.name}"? It will become active again.`}
        confirmLabel="Restore"
      />
    </div>
  );
}
