import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { getSpecies, getBreeds, getPetSizes, getCoatColors, uploadMedia } from "@/services/portal";
import { MediaCategory } from "@/constants/mediaCategory";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormSelect,
  FormTextarea,
  FormSection,
  FormDivider,
  CheckboxField,
  SingleImageField,
} from "@/components/portal/ui";
import type { ListingData, LookupOption } from "@/types/portal.types";

const GENDERS = ["Male", "Female", "Unknown"] as const;

interface Props {
  value: Partial<ListingData>;
  onChange: (v: Partial<ListingData>) => void;
}

export function ListingForm({ value, onChange }: Props) {
  const [species, setSpecies] = useState<LookupOption[]>([]);
  const [breeds, setBreeds] = useState<LookupOption[]>([]);
  const [sizes, setSizes] = useState<LookupOption[]>([]);
  const [colors, setColors] = useState<LookupOption[]>([]);
  const [breedsLoading, setBreedsLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    getSpecies().then(setSpecies).catch(() => {});
    getPetSizes().then(setSizes).catch(() => {});
    getCoatColors().then(setColors).catch(() => {});
  }, []);

  useEffect(() => {
    if (!value.speciesId) { setBreeds([]); return; }
    setBreedsLoading(true);
    getBreeds(value.speciesId)
      .then(setBreeds)
      .catch(() => setBreeds([]))
      .finally(() => setBreedsLoading(false));
  }, [value.speciesId]);

  const set = (patch: Partial<ListingData>) => onChange({ ...value, ...patch });

  const handlePhoto = async (file: File) => {
    setPhotoUploading(true);
    try {
      const res = await uploadMedia(file, MediaCategory.AdoptionListingPhoto);
      set({ photoAssetId: res.assetId });
      if (res.url) setPhotoPreview(res.url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to upload photo.");
    } finally {
      setPhotoUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Photo — first, most visual */}
      <FormSection title="Photo" description="A clear photo helps adopters connect with your pet.">
        <SingleImageField
          label="Pet photo"
          currentUrl={null}
          previewUrl={photoPreview}
          onFile={handlePhoto}
          uploading={photoUploading}
          shape="wide"
        />
        {!value.photoAssetId && (
          <p className="text-xs text-amber-600">A photo is required to publish this listing.</p>
        )}
      </FormSection>

      <FormDivider />

      {/* Identity */}
      <FormSection title="Identity">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Pet name" required>
            <Input
              value={value.petName ?? ""}
              onChange={(e) => set({ petName: e.target.value })}
              placeholder="e.g. Buddy"
            />
          </FormField>

          <FormField label="Gender" required>
            <FormSelect
              value={value.gender ?? ""}
              onChange={(e) => set({ gender: e.target.value as ListingData["gender"] })}
            >
              <option value="" disabled>Select gender</option>
              {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </FormSelect>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Species" required>
            <FormSelect
              value={value.speciesId ?? ""}
              onChange={(e) => set({ speciesId: Number(e.target.value), breedId: null })}
            >
              <option value="" disabled>Select species</option>
              {species.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </FormSelect>
          </FormField>

          <FormField
            label="Breed"
            hint={value.speciesId ? undefined : "Select a species first"}
          >
            <FormSelect
              value={value.breedId ?? ""}
              onChange={(e) => set({ breedId: e.target.value ? Number(e.target.value) : null })}
              disabled={!value.speciesId || breedsLoading}
            >
              <option value="">{breedsLoading ? "Loading..." : "Unknown / mixed"}</option>
              {breeds.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </FormSelect>
          </FormField>
        </div>

        <FormField label="Date of birth" hint="Approximate is fine">
          <Input
            type="date"
            value={value.dateOfBirth ? value.dateOfBirth.slice(0, 10) : ""}
            onChange={(e) =>
              set({ dateOfBirth: e.target.value ? `${e.target.value}T00:00:00Z` : null })
            }
          />
        </FormField>
      </FormSection>

      <FormDivider />

      {/* Characteristics */}
      <FormSection title="Characteristics">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Size">
            <FormSelect
              value={value.sizeId ?? ""}
              onChange={(e) => set({ sizeId: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Unknown</option>
              {sizes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </FormSelect>
          </FormField>

          <FormField label="Coat color">
            <FormSelect
              value={value.coatColorId ?? ""}
              onChange={(e) =>
                set({ coatColorId: e.target.value ? Number(e.target.value) : null })
              }
            >
              <option value="">Unknown</option>
              {colors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </FormSelect>
          </FormField>
        </div>

        <div className="flex flex-col gap-3">
          <CheckboxField
            label="Vaccinated"
            hint="Pet has received appropriate vaccinations"
            checked={value.vaccinated ?? false}
            onChange={(v) => set({ vaccinated: v })}
          />
          <CheckboxField
            label="Neutered / spayed"
            checked={value.neutered ?? false}
            onChange={(v) => set({ neutered: v })}
          />
          <CheckboxField
            label="Good with kids"
            hint="Comfortable around children"
            checked={value.goodWithKids ?? false}
            onChange={(v) => set({ goodWithKids: v })}
          />
        </div>
      </FormSection>

      <FormDivider />

      {/* About */}
      <FormSection title="About" description="Help adopters understand this pet's personality.">
        <FormField label="Description">
          <FormTextarea
            rows={4}
            maxLength={1000}
            value={value.description ?? ""}
            onChange={(e) => set({ description: e.target.value })}
            placeholder="Describe the pet's personality, habits, and any special needs..."
          />
        </FormField>
      </FormSection>

      <FormDivider />

      {/* Location */}
      <FormSection title="Location">
        <FormField label="Location label" hint="e.g. Beirut, Lebanon">
          <Input
            value={value.locationLabel ?? ""}
            onChange={(e) => set({ locationLabel: e.target.value })}
            placeholder="City, country"
          />
        </FormField>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors w-fit"
        >
          {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {showAdvanced ? "Hide" : "Add"} GPS coordinates
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Latitude">
              <Input
                type="number"
                step="any"
                placeholder="e.g. 33.8886"
                value={value.latitude ?? ""}
                onChange={(e) =>
                  set({ latitude: e.target.value ? Number(e.target.value) : null })
                }
              />
            </FormField>
            <FormField label="Longitude">
              <Input
                type="number"
                step="any"
                placeholder="e.g. 35.4955"
                value={value.longitude ?? ""}
                onChange={(e) =>
                  set({ longitude: e.target.value ? Number(e.target.value) : null })
                }
              />
            </FormField>
          </div>
        )}
      </FormSection>
    </div>
  );
}
