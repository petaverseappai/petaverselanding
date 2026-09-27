import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Upload, X, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import {
  getServiceProvider,
  createServiceProvider,
  updateServiceProvider,
  getCategories,
  getLookupsByType,
  getUploadUrl,
  confirmUpload,
} from "@/services/admin";
import type {
  ServiceProviderWrite,
  ServiceProviderHour,
  ServiceProviderBranch,
  Category,
  LookupItem,
} from "@/services/admin";
import {
  PageHeader,
  Panel,
  Field,
  TextField,
  Textarea,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ROUTES } from "@/constants/routes";
import { errMessage } from "@/lib/adminFormat";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Time picker
// ---------------------------------------------------------------------------

function parseTime(t: string): { h: number; m: number } {
  const [h, m] = t.split(":").map(Number);
  return { h: h ?? 0, m: m ?? 0 };
}

function fmtTime(h: number, m: number): string {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}


function TimePicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  const { h, m } = parseTime(value);

  const stepH = (delta: number) => {
    const next = (h + delta + 24) % 24;
    onChange(fmtTime(next, m));
  };
  const stepM = (delta: number) => {
    const next = (m + delta + 60) % 60;
    onChange(fmtTime(h, next));
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">{label}</span>
      <div className="flex items-center gap-0.5 rounded-xl border border-border bg-muted px-3 py-2">
        {/* Hours */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => stepH(1)}
            className="rounded p-0.5 text-gray-400 hover:text-paw-orange transition-colors"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <span className="w-6 select-none text-center text-sm font-semibold tabular-nums text-gray-900">
            {String(h).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={() => stepH(-1)}
            className="rounded p-0.5 text-gray-400 hover:text-paw-orange transition-colors"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>

        <span className="mb-0.5 px-0.5 text-sm font-bold text-gray-400">:</span>

        {/* Minutes */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => stepM(5)}
            className="rounded p-0.5 text-gray-400 hover:text-paw-orange transition-colors"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <span className="w-6 select-none text-center text-sm font-semibold tabular-nums text-gray-900">
            {String(m).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={() => stepM(-5)}
            className="rounded p-0.5 text-gray-400 hover:text-paw-orange transition-colors"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hours editor
// ---------------------------------------------------------------------------

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function HoursEditor({
  hours,
  onChange,
}: {
  hours: ServiceProviderHour[];
  onChange: (hours: ServiceProviderHour[]) => void;
}) {
  const enabledDays = new Set(hours.map((h) => h.dayOfWeek));

  const toggleDay = (day: number) => {
    if (enabledDays.has(day)) {
      onChange(hours.filter((h) => h.dayOfWeek !== day));
    } else {
      const sorted = [
        ...hours,
        { dayOfWeek: day, startTime: "09:00", endTime: "18:00", interval: 30 },
      ].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
      onChange(sorted);
    }
  };

  const updateHour = (day: number, patch: Partial<ServiceProviderHour>) => {
    onChange(hours.map((h) => (h.dayOfWeek === day ? { ...h, ...patch } : h)));
  };

  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden">
      {/* Day toggles */}
      <div className="flex items-center gap-2 flex-wrap px-4 py-3 bg-muted border-b border-border">
        {DAY_NAMES.map((name, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => toggleDay(idx)}
            className={cn(
              "h-8 w-12 rounded-full text-xs font-semibold transition-all",
              enabledDays.has(idx)
                ? "bg-paw-orange text-white shadow-sm"
                : "bg-white border border-border text-gray-500 hover:border-paw-orange hover:text-paw-orange",
            )}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Per-day rows */}
      {hours.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-gray-400">
          Toggle days above to set hours.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {hours.map((h) => (
            <div
              key={h.dayOfWeek}
              className="flex items-center gap-4 px-4 py-3 flex-wrap"
            >
              <span className="w-8 text-xs font-bold text-gray-500 shrink-0">
                {DAY_NAMES[h.dayOfWeek]}
              </span>

              <div className="flex items-center gap-3">
                <TimePicker
                  label="Open"
                  value={h.startTime}
                  onChange={(v) => updateHour(h.dayOfWeek, { startTime: v })}
                />
                <span className="text-xs text-gray-300 mt-4">—</span>
                <TimePicker
                  label="Close"
                  value={h.endTime}
                  onChange={(v) => updateHour(h.dayOfWeek, { endTime: v })}
                />
              </div>

              <div className="flex flex-col items-center gap-1 ml-auto">
                <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Slot</span>
                <select
                  value={h.interval}
                  onChange={(e) => updateHour(h.dayOfWeek, { interval: Number(e.target.value) })}
                  className="h-9 rounded-xl border border-border bg-muted px-2 text-sm font-semibold text-gray-700 focus:border-paw-orange focus:outline-none focus:ring-1 focus:ring-paw-orange"
                >
                  {[15, 20, 30, 45, 60, 90, 120].map((v) => (
                    <option key={v} value={v}>{v} min</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Selection container (categories / services / species)
// ---------------------------------------------------------------------------

function SelectionBox({
  title,
  children,
  count,
}: {
  title: string;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</span>
        {count !== undefined && count > 0 && (
          <span className="rounded-full bg-paw-orange/15 px-2 py-0.5 text-[10px] font-bold text-paw-orange">
            {count}
          </span>
        )}
      </div>
      <div className="max-h-52 overflow-y-auto p-3 space-y-0.5">
        {children}
      </div>
    </div>
  );
}

function SelectionItem({
  checked,
  onChange,
  children,
  badge,
  action,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors",
        checked ? "bg-paw-orange/8" : "hover:bg-muted",
      )}
    >
      <Checkbox
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="flex-1 text-sm text-gray-700">{children}</span>
      {badge}
      {action}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Branch editor
// ---------------------------------------------------------------------------

const EMPTY_BRANCH: ServiceProviderBranch = {
  address: "",
  latitude: 0,
  longitude: 0,
  phone: "",
  whatsApp: null,
  emergency: null,
  website: null,
  instagram: null,
  email: null,
};

function BranchEditor({
  branch,
  index,
  total,
  onUpdate,
  onRemove,
}: {
  branch: ServiceProviderBranch;
  index: number;
  total: number;
  onUpdate: (patch: Partial<ServiceProviderBranch>) => void;
  onRemove: () => void;
}) {
  const opt = (field: keyof ServiceProviderBranch) =>
    (branch[field] as string | null) ?? "";

  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Branch {index + 1}
        </span>
        {total > 1 && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Address *</label>
            <TextField value={branch.address} onChange={(v) => onUpdate({ address: v })} placeholder="Street address" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Phone *</label>
            <TextField value={branch.phone} onChange={(v) => onUpdate({ phone: v })} placeholder="+961..." />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Latitude</label>
            <TextField
              type="number"
              value={String(branch.latitude)}
              onChange={(v) => onUpdate({ latitude: parseFloat(v) || 0 })}
              placeholder="33.88"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Longitude</label>
            <TextField
              type="number"
              value={String(branch.longitude)}
              onChange={(v) => onUpdate({ longitude: parseFloat(v) || 0 })}
              placeholder="35.67"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">WhatsApp</label>
            <TextField value={opt("whatsApp")} onChange={(v) => onUpdate({ whatsApp: v || null })} placeholder="+961..." />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Emergency</label>
            <TextField value={opt("emergency")} onChange={(v) => onUpdate({ emergency: v || null })} placeholder="+961..." />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Email</label>
            <TextField value={opt("email")} onChange={(v) => onUpdate({ email: v || null })} placeholder="contact@..." />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Website</label>
            <TextField value={opt("website")} onChange={(v) => onUpdate({ website: v || null })} placeholder="https://..." />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Instagram</label>
          <TextField value={opt("instagram")} onChange={(v) => onUpdate({ instagram: v || null })} placeholder="@handle" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle (matches AppConfigPage)
// ---------------------------------------------------------------------------

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-paw-orange focus:ring-offset-2",
        value ? "bg-paw-orange" : "bg-gray-200",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
          value ? "translate-x-6" : "translate-x-1",
        )}
      />
      <span className="sr-only">{label}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ServiceProviderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<LookupItem[]>([]);
  const [species, setSpecies] = useState<LookupItem[]>([]);

  const [formData, setFormData] = useState<ServiceProviderWrite>({
    name: "",
    description: "",
    isVerified: false,
    isVet: false,
    logoUrl: "",
    appUserId: null,
    branches: [{ ...EMPTY_BRANCH }],
    categories: [],
    serviceIds: [],
    speciesIds: [],
    specializations: [],
    hours: [],
  });

  useEffect(() => {
    Promise.all([
      getCategories(),
      getLookupsByType("services"),
      getLookupsByType("species"),
    ])
      .then(([cats, svcs, spec]) => {
        setCategories(cats);
        setServices(svcs);
        setSpecies(spec);
      })
      .catch((e) => toast.error(errMessage(e, "Failed to load lookups.")));
  }, []);

  useEffect(() => {
    if (!isNew && id) {
      setLoading(true);
      getServiceProvider(Number(id))
        .then((p) => {
          setFormData({
            name: p.name,
            description: p.description,
            isVerified: p.isVerified,
            isVet: p.isVet,
            logoUrl: p.logoUrl,
            appUserId: p.appUserId,
            branches: p.branches,
            categories: p.categories,
            serviceIds: p.serviceIds,
            speciesIds: p.speciesIds,
            specializations: p.specializations,
            hours: p.hours,
          });
        })
        .catch((e) => toast.error(errMessage(e, "Failed to load provider.")))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    setUploading(true);
    try {
      const uploadInfo = await getUploadUrl(file.type, file.name);
      const putResponse = await fetch(uploadInfo.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": uploadInfo.contentType },
        body: await file.arrayBuffer(),
      });
      if (!putResponse.ok) throw new Error("Failed to upload to R2");
      const confirmResponse = await confirmUpload(uploadInfo.assetId);
      setFormData((prev) => ({ ...prev, logoUrl: confirmResponse.url }));
      toast.success("Logo uploaded.");
    } catch (e) {
      toast.error(errMessage(e, "Failed to upload logo."));
    } finally {
      setUploading(false);
    }
  };

  const updateBranch = (idx: number, patch: Partial<ServiceProviderBranch>) => {
    setFormData((prev) => {
      const branches = [...prev.branches];
      branches[idx] = { ...branches[idx], ...patch };
      return { ...prev, branches };
    });
  };

  const toggleCategory = (catId: number, checked: boolean) => {
    setFormData((prev) => {
      if (!checked) {
        return { ...prev, categories: prev.categories.filter((c) => c.categoryId !== catId) };
      }
      const isPrimary = prev.categories.length === 0 || prev.categories.every((c) => !c.isPrimary);
      return { ...prev, categories: [...prev.categories, { categoryId: catId, isPrimary }] };
    });
  };

  const makePrimaryCategory = (catId: number) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => ({ ...c, isPrimary: c.categoryId === catId })),
    }));
  };

  const toggleServiceId = (svcId: number, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      serviceIds: checked ? [...prev.serviceIds, svcId] : prev.serviceIds.filter((x) => x !== svcId),
    }));
  };

  const toggleSpeciesId = (spId: number, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      speciesIds: checked ? [...prev.speciesIds, spId] : prev.speciesIds.filter((x) => x !== spId),
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        await createServiceProvider(formData);
        toast.success("Provider created.");
        navigate(ROUTES.ADMIN_SERVICE_PROVIDERS);
      } else {
        await updateServiceProvider(Number(id), formData);
        toast.success("Provider updated.");
      }
    } catch (e) {
      toast.error(errMessage(e, "Failed to save provider."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-400">Loading...</p>;

  return (
    <div className="space-y-6">
      <Link
        to={ROUTES.ADMIN_SERVICE_PROVIDERS}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to providers
      </Link>

      <PageHeader
        title={isNew ? "Add service provider" : formData.name || "Service provider"}
        subtitle={isNew ? "Create a new service provider profile." : undefined}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* ── Left column: identity + flags ── */}
        <div className="space-y-6 lg:col-span-2">

          <Panel>
            <div className="border-b border-border px-6 py-4">
              <h3 className="text-sm font-semibold text-gray-900">Identity</h3>
            </div>
            <div className="space-y-5 p-6">

              {/* Logo */}
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500">Logo</label>
                <div className="flex items-center gap-4">
                  {formData.logoUrl ? (
                    <div className="relative shrink-0">
                      <img
                        src={formData.logoUrl}
                        alt="Logo"
                        className="h-16 w-16 rounded-2xl object-cover border border-border shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, logoUrl: "" }))}
                        className="absolute -top-1.5 -right-1.5 rounded-full bg-white border border-border p-0.5 text-gray-400 hover:text-red-500 shadow-sm transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-16 w-16 shrink-0 rounded-2xl border-2 border-dashed border-border bg-muted flex items-center justify-center">
                      <Upload className="h-5 w-5 text-gray-300" />
                    </div>
                  )}
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-muted px-4 py-2 text-sm font-medium text-gray-600 hover:bg-white hover:border-paw-orange transition-colors">
                    <Upload className="h-4 w-4 text-gray-400" />
                    {uploading ? "Uploading..." : "Upload image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) handleLogoUpload(e.target.files[0]); }}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              <Field label="Name *">
                <TextField
                  value={formData.name}
                  onChange={(v) => setFormData((prev) => ({ ...prev, name: v }))}
                  placeholder="Provider name"
                />
              </Field>

              <Field label="Description">
                <Textarea
                  value={formData.description}
                  onChange={(v) => setFormData((prev) => ({ ...prev, description: v }))}
                  placeholder="Business description"
                />
              </Field>
            </div>
          </Panel>

          {/* Branches */}
          <Panel>
            <div className="border-b border-border px-6 py-4">
              <h3 className="text-sm font-semibold text-gray-900">Branches</h3>
            </div>
            <div className="space-y-4 p-6">
              {formData.branches.map((branch, idx) => (
                <BranchEditor
                  key={idx}
                  branch={branch}
                  index={idx}
                  total={formData.branches.length}
                  onUpdate={(patch) => updateBranch(idx, patch)}
                  onRemove={() =>
                    setFormData((prev) => ({
                      ...prev,
                      branches: prev.branches.filter((_, i) => i !== idx),
                    }))
                  }
                />
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    branches: [...prev.branches, { ...EMPTY_BRANCH }],
                  }))
                }
              >
                <Plus className="h-4 w-4" /> Add branch
              </Button>
            </div>
          </Panel>

          {/* Hours */}
          <Panel>
            <div className="border-b border-border px-6 py-4">
              <h3 className="text-sm font-semibold text-gray-900">Hours</h3>
            </div>
            <div className="p-6">
              <HoursEditor
                hours={formData.hours}
                onChange={(hours) => setFormData((prev) => ({ ...prev, hours }))}
              />
            </div>
          </Panel>

        </div>

        {/* ── Right column: flags + classification ── */}
        <div className="space-y-6">

          <Panel className="p-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Verified</p>
                  <p className="text-xs text-gray-400">Show verified badge in app</p>
                </div>
                <Toggle
                  value={formData.isVerified}
                  onChange={(v) => setFormData((prev) => ({ ...prev, isVerified: v }))}
                  label="Verified"
                />
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Veterinarian</p>
                  <p className="text-xs text-gray-400">Enables vet-specific features</p>
                </div>
                <Toggle
                  value={formData.isVet}
                  onChange={(v) => setFormData((prev) => ({ ...prev, isVet: v }))}
                  label="Veterinarian"
                />
              </div>
            </div>
          </Panel>

          <Panel className="p-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Classification</h3>
            <div className="space-y-4">

              <div>
                <p className="mb-2 text-xs font-medium text-gray-500">Categories</p>
                <SelectionBox title="Categories" count={formData.categories.length}>
                  {categories.map((cat) => {
                    const selected = formData.categories.find((c) => c.categoryId === cat.id);
                    return (
                      <SelectionItem
                        key={cat.id}
                        checked={!!selected}
                        onChange={(chk) => toggleCategory(cat.id, chk)}
                        badge={
                          selected?.isPrimary ? (
                            <span className="rounded-full bg-paw-orange/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-paw-orange">
                              Primary
                            </span>
                          ) : undefined
                        }
                        action={
                          selected && !selected.isPrimary ? (
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); makePrimaryCategory(cat.id); }}
                              className="text-[10px] text-gray-400 hover:text-paw-orange transition-colors"
                            >
                              Make primary
                            </button>
                          ) : undefined
                        }
                      >
                        {cat.name}
                      </SelectionItem>
                    );
                  })}
                </SelectionBox>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-gray-500">Services</p>
                <SelectionBox title="Services" count={formData.serviceIds.length}>
                  {services.map((svc) => (
                    <SelectionItem
                      key={svc.id}
                      checked={formData.serviceIds.includes(svc.id)}
                      onChange={(chk) => toggleServiceId(svc.id, chk)}
                    >
                      {svc.name}
                    </SelectionItem>
                  ))}
                </SelectionBox>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-gray-500">Species</p>
                <SelectionBox title="Species" count={formData.speciesIds.length}>
                  {species.map((sp) => (
                    <SelectionItem
                      key={sp.id}
                      checked={formData.speciesIds.includes(sp.id)}
                      onChange={(chk) => toggleSpeciesId(sp.id, chk)}
                    >
                      {sp.name}
                    </SelectionItem>
                  ))}
                </SelectionBox>
              </div>

            </div>
          </Panel>

          {/* Save */}
          <div className="flex flex-col gap-2">
            <Button disabled={saving} onClick={handleSave} className="w-full">
              {saving ? "Saving..." : isNew ? "Create provider" : "Save changes"}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate(ROUTES.ADMIN_SERVICE_PROVIDERS)}>
              Cancel
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
