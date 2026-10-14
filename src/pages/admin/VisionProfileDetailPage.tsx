import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import {
  getVisionProfile,
  createVisionProfile,
  updateVisionProfile,
  getLookupsByType,
} from "@/services/admin";
import type { VisionProfileWrite, LookupItem } from "@/services/admin";
import {
  PageHeader,
  Panel,
  Field,
  TextField,
  Textarea,
  SelectField,
  LoadingState,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ROUTES } from "@/constants/routes";
import { errMessage } from "@/lib/adminFormat";

const EMPTY_MATRIX: number[][] = [
  [1.0, 0.0, 0.0],
  [0.0, 1.0, 0.0],
  [0.0, 0.0, 1.0],
];

const DEFAULT_FORM: VisionProfileWrite = {
  speciesId: 0,
  colorMatrix: EMPTY_MATRIX,
  brightness: 1.0,
  contrast: 1.0,
  saturation: 1.0,
  description: "",
  funFact: "",
  isActive: true,
};

function MatrixEditor({
  value,
  onChange,
}: {
  value: number[][];
  onChange: (m: number[][]) => void;
}) {
  const handleCell = (row: number, col: number, raw: string) => {
    const n = parseFloat(raw);
    const next = value.map((r, ri) =>
      r.map((c, ci) => (ri === row && ci === col ? (isNaN(n) ? 0 : n) : c)),
    );
    onChange(next);
  };

  return (
    <div className="space-y-1">
      {value.map((row, ri) => (
        <div key={ri} className="flex gap-1">
          {row.map((cell, ci) => (
            <input
              key={ci}
              type="number"
              step="0.01"
              value={cell}
              onChange={(e) => handleCell(ri, ci, e.target.value)}
              className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-center text-sm focus:border-paw-orange focus:outline-none focus:ring-1 focus:ring-paw-orange"
            />
          ))}
        </div>
      ))}
      <p className="text-xs text-gray-400">3 rows x 3 columns (R,G,B)</p>
    </div>
  );
}

export default function VisionProfileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new";

  const [form, setForm] = useState<VisionProfileWrite>(DEFAULT_FORM);
  const [species, setSpecies] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getLookupsByType("species")
      .then(setSpecies)
      .catch((e) => toast.error(errMessage(e, "Failed to load species.")));
  }, []);

  useEffect(() => {
    if (isNew || !id) return;
    setLoading(true);
    getVisionProfile(Number(id))
      .then((p) =>
        setForm({
          speciesId: p.speciesId,
          colorMatrix: p.colorMatrix,
          brightness: p.brightness,
          contrast: p.contrast,
          saturation: p.saturation,
          description: p.description,
          funFact: p.funFact,
          isActive: p.isActive,
        }),
      )
      .catch((e) => toast.error(errMessage(e, "Failed to load vision profile.")))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const set = <K extends keyof VisionProfileWrite>(k: K, v: VisionProfileWrite[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!form.speciesId) {
      toast.error("Please select a species.");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        await createVisionProfile(form);
        toast.success("Vision profile created.");
        navigate(ROUTES.ADMIN_VISION_PROFILES);
      } else {
        await updateVisionProfile(Number(id), form);
        toast.success("Vision profile updated.");
      }
    } catch (e) {
      toast.error(errMessage(e, "Failed to save vision profile."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isNew ? "New Vision Profile" : "Edit Vision Profile"}
        subtitle={
          <button
            onClick={() => navigate(ROUTES.ADMIN_VISION_PROFILES)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Vision Profiles
          </button>
        }
        actions={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        }
      />

      {loading ? (
        <LoadingState />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel className="space-y-4 p-6">
            <h2 className="text-sm font-semibold text-gray-700">General</h2>

            <Field label="Species *">
              <SelectField
                value={form.speciesId ? String(form.speciesId) : ""}
                onChange={(v) => set("speciesId", Number(v))}
                options={species.map((s) => ({ value: String(s.id), label: s.name }))}
                placeholder="Select species..."
                className="w-full"
              />
            </Field>

            <Field label="Description">
              <Textarea
                value={form.description}
                onChange={(v) => set("description", v)}
                placeholder="Describe how this species perceives color..."
                rows={3}
              />
            </Field>

            <Field label="Fun Fact">
              <Textarea
                value={form.funFact}
                onChange={(v) => set("funFact", v)}
                placeholder="An interesting fact about this species' vision..."
                rows={3}
              />
            </Field>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={form.isActive}
                onChange={(e) => set("isActive", e.target.checked)}
              />
              <label htmlFor="isActive" className="text-sm text-gray-700 cursor-pointer">
                Active
              </label>
            </div>
          </Panel>

          <Panel className="space-y-4 p-6">
            <h2 className="text-sm font-semibold text-gray-700">Color Adjustments</h2>

            <Field label="Color Matrix">
              <MatrixEditor
                value={form.colorMatrix}
                onChange={(m) => set("colorMatrix", m)}
              />
            </Field>

            <Field label="Brightness">
              <TextField
                type="number"
                value={String(form.brightness)}
                onChange={(v) => set("brightness", parseFloat(v) || 0)}
                className="w-full"
              />
            </Field>

            <Field label="Contrast">
              <TextField
                type="number"
                value={String(form.contrast)}
                onChange={(v) => set("contrast", parseFloat(v) || 0)}
                className="w-full"
              />
            </Field>

            <Field label="Saturation">
              <TextField
                type="number"
                value={String(form.saturation)}
                onChange={(v) => set("saturation", parseFloat(v) || 0)}
                className="w-full"
              />
            </Field>
          </Panel>
        </div>
      )}
    </div>
  );
}
