import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  MapPin,
  Phone,
  Pencil,
  Trash2,
  Plus,
  Upload,
  X,
  ExternalLink,
  Instagram,
  Mail,
} from "lucide-react";
import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  uploadMedia,
} from "@/services/portal";
import { MediaCategory } from "@/constants/mediaCategory";
import {
  PageHeader,
  Panel,
  LoadingState,
  EmptyState,
  Modal,
  ConfirmModal,
} from "@/components/admin/ui";
import { FormField } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProviderBranch, ProviderBranchWrite } from "@/types/portal.types";

// The backend returns RFC 7807 ProblemDetails ({ status, title, detail }).
// Surface `detail` so validation messages (e.g. lone lat/lng) land inline.
function branchError(e: unknown, fallback: string): string {
  const body = (e as { response?: { data?: { detail?: string; title?: string } } })
    ?.response?.data;
  return body?.detail ?? body?.title ?? fallback;
}

interface BranchForm {
  address: string;
  latitude: string;
  longitude: string;
  phone: string;
  whatsApp: string;
  emergency: string;
  website: string;
  instagram: string;
  email: string;
  storefrontImageUrl: string | null;
}

const EMPTY_FORM: BranchForm = {
  address: "",
  latitude: "",
  longitude: "",
  phone: "",
  whatsApp: "",
  emergency: "",
  website: "",
  instagram: "",
  email: "",
  storefrontImageUrl: null,
};

function toForm(b: ProviderBranch): BranchForm {
  return {
    address: b.address,
    latitude: b.latitude !== null ? String(b.latitude) : "",
    longitude: b.longitude !== null ? String(b.longitude) : "",
    phone: b.phone ?? "",
    whatsApp: b.whatsApp ?? "",
    emergency: b.emergency ?? "",
    website: b.website ?? "",
    instagram: b.instagram ?? "",
    email: b.email ?? "",
    storefrontImageUrl: b.storefrontImageUrl,
  };
}

// Blank optional fields become null; strings trimmed. lat/lng must be sent
// together, so we only include them when both parse to numbers.
function toWrite(form: BranchForm): ProviderBranchWrite {
  const opt = (v: string): string | null => {
    const t = v.trim();
    return t.length > 0 ? t : null;
  };
  const lat = parseFloat(form.latitude);
  const lng = parseFloat(form.longitude);
  const hasCoords = !Number.isNaN(lat) && !Number.isNaN(lng);

  return {
    address: form.address.trim(),
    latitude: hasCoords ? lat : null,
    longitude: hasCoords ? lng : null,
    phone: opt(form.phone),
    whatsApp: opt(form.whatsApp),
    emergency: opt(form.emergency),
    website: opt(form.website),
    instagram: opt(form.instagram),
    email: opt(form.email),
    storefrontImageUrl: form.storefrontImageUrl,
  };
}

export default function PortalBranchesPage() {
  const [branches, setBranches] = useState<ProviderBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [notProvider, setNotProvider] = useState(false);

  // Editor modal — `editing` null means creating a new branch.
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProviderBranch | null>(null);
  const [form, setForm] = useState<BranchForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Delete confirmation.
  const [deleteTarget, setDeleteTarget] = useState<ProviderBranch | null>(null);

  const load = () => {
    setLoading(true);
    getBranches()
      .then(setBranches)
      .catch((e) => {
        if ((e as { response?: { status?: number } })?.response?.status === 403) {
          setNotProvider(true);
        } else {
          toast.error(branchError(e, "Failed to load branches."));
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (b: ProviderBranch) => {
    setEditing(b);
    setForm(toForm(b));
    setModalOpen(true);
  };

  const patch = (p: Partial<BranchForm>) => setForm((prev) => ({ ...prev, ...p }));

  const handleStorefrontUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    setUploading(true);
    try {
      const res = await uploadMedia(file, MediaCategory.ProviderLogo);
      if (res.url) patch({ storefrontImageUrl: res.url });
    } catch {
      toast.error("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.address.trim()) {
      toast.error("Address is required.");
      return;
    }
    // Guard the pair client-side so we show a clean message before the 400.
    const hasLat = form.latitude.trim().length > 0;
    const hasLng = form.longitude.trim().length > 0;
    if (hasLat !== hasLng) {
      toast.error("Latitude and longitude must be provided together.");
      return;
    }
    setSaving(true);
    try {
      const body = toWrite(form);
      if (editing) {
        const updated = await updateBranch(editing.id, body);
        setBranches((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        toast.success("Branch updated.");
      } else {
        const created = await createBranch(body);
        setBranches((prev) => [...prev, created]);
        toast.success("Branch added.");
      }
      setModalOpen(false);
    } catch (e) {
      toast.error(branchError(e, "Failed to save branch."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBranch(deleteTarget.id);
      setBranches((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      toast.success("Branch deleted.");
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        toast.error("You must keep at least one branch. Add another before deleting this one.");
      } else if (status === 404) {
        // Already gone — reconcile the list.
        setBranches((prev) => prev.filter((b) => b.id !== deleteTarget.id));
        toast.error("That branch no longer exists.");
      } else {
        toast.error(branchError(e, "Failed to delete branch."));
      }
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) return <LoadingState />;

  if (notProvider) {
    return (
      <div className="space-y-6">
        <PageHeader title="Branches" />
        <Panel className="p-6">
          <p className="text-sm text-gray-500">
            Your account isn't set up as a service provider, so there are no branches to manage.
          </p>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branches"
        subtitle="Manage your locations shown on the map and your page."
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add branch
          </Button>
        }
      />

      {branches.length === 0 ? (
        <Panel>
          <EmptyState>No branches yet. Add your first location.</EmptyState>
        </Panel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {branches.map((b) => (
            <Panel key={b.id} className="overflow-hidden">
              {b.storefrontImageUrl ? (
                <img
                  src={b.storefrontImageUrl}
                  alt={b.address}
                  className="h-36 w-full object-cover"
                />
              ) : (
                <div className="flex h-36 w-full items-center justify-center bg-gray-100 text-gray-300">
                  <MapPin className="h-8 w-8" />
                </div>
              )}

              <div className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900">{b.address}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => openEdit(b)}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                      aria-label="Edit branch"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(b)}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      aria-label="Delete branch"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 text-sm text-gray-500">
                  {b.phone && (
                    <span className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                      {b.phone}
                    </span>
                  )}
                  {b.email && (
                    <span className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                      {b.email}
                    </span>
                  )}
                  {b.instagram && (
                    <span className="flex items-center gap-2">
                      <Instagram className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                      {b.instagram}
                    </span>
                  )}
                  {b.website && (
                    <a
                      href={b.website.startsWith("http") ? b.website : `https://${b.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-paw-blue hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      {b.website}
                    </a>
                  )}
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {/* Editor modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit branch" : "Add branch"}
        wide
        dismissOnBackdrop={false}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || uploading}>
              {saving ? "Saving..." : editing ? "Save changes" : "Add branch"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Storefront image */}
          <div>
            <span className="mb-2 block text-sm font-medium text-gray-700">
              Storefront image
            </span>
            <div className="flex items-center gap-4">
              {form.storefrontImageUrl ? (
                <div className="relative shrink-0">
                  <img
                    src={form.storefrontImageUrl}
                    alt="Storefront"
                    className="h-20 w-32 rounded-2xl border border-border object-cover shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => patch({ storefrontImageUrl: null })}
                    className="absolute -right-1.5 -top-1.5 rounded-full border border-border bg-white p-0.5 text-gray-400 shadow-sm transition-colors hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex h-20 w-32 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted">
                  <Upload className="h-5 w-5 text-gray-300" />
                </div>
              )}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-muted px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-paw-orange hover:bg-white">
                <Upload className="h-4 w-4 text-gray-400" />
                {uploading ? "Uploading..." : "Upload image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleStorefrontUpload(e.target.files[0]);
                  }}
                />
              </label>
            </div>
          </div>

          <FormField label="Address" required>
            <Input
              value={form.address}
              onChange={(e) => patch({ address: e.target.value })}
              placeholder="12 Hamra St, Beirut"
              maxLength={300}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Latitude" hint="Must be set together with longitude">
              <Input
                type="number"
                value={form.latitude}
                onChange={(e) => patch({ latitude: e.target.value })}
                placeholder="33.8959"
              />
            </FormField>
            <FormField label="Longitude" hint="Must be set together with latitude">
              <Input
                type="number"
                value={form.longitude}
                onChange={(e) => patch({ longitude: e.target.value })}
                placeholder="35.4789"
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Phone">
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => patch({ phone: e.target.value })}
                placeholder="+961 1 234 567"
                maxLength={50}
              />
            </FormField>
            <FormField label="WhatsApp">
              <Input
                type="tel"
                value={form.whatsApp}
                onChange={(e) => patch({ whatsApp: e.target.value })}
                placeholder="+961 1 234 567"
                maxLength={50}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Emergency">
              <Input
                type="tel"
                value={form.emergency}
                onChange={(e) => patch({ emergency: e.target.value })}
                placeholder="+961 1 999 888"
                maxLength={50}
              />
            </FormField>
            <FormField label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => patch({ email: e.target.value })}
                placeholder="hello@vetclinic.com"
                maxLength={200}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Website">
              <Input
                value={form.website}
                onChange={(e) => patch({ website: e.target.value })}
                placeholder="vetclinic.com"
                maxLength={300}
              />
            </FormField>
            <FormField label="Instagram" hint="Handle or URL">
              <Input
                value={form.instagram}
                onChange={(e) => patch({ instagram: e.target.value })}
                placeholder="@beirutvet"
                maxLength={100}
              />
            </FormField>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete branch"
        message={
          deleteTarget
            ? `Delete the branch at "${deleteTarget.address}"? This can't be undone.`
            : ""
        }
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
