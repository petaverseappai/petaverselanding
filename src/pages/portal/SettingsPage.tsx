import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getPage, updatePage, uploadMedia, checkHandleAvailable } from "@/services/portal";
import { MediaCategory } from "@/constants/mediaCategory";
import { usePageId, usePortalPage } from "@/context/PortalPageContext";
import { PageHeader, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormTextarea,
  FormSection,
  FormDivider,
  InputWithPrefix,
} from "@/components/portal/ui";
import { cn } from "@/lib/utils";
import type { MyPage } from "@/types/portal.types";

export default function PortalSettingsPage() {
  const pageId = usePageId();
  const { setPage } = usePortalPage();

  const [page, setLocal] = useState<MyPage | null>(null);
  const [saving, setSaving] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);

  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [handleStatus, setHandleStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const savedHandle = useRef("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [bannerAssetId, setBannerAssetId] = useState<string | undefined>(undefined);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  useEffect(() => {
    getPage(pageId)
      .then((p) => {
        setLocal(p);
        setName(p.name);
        setHandle(p.handle);
        savedHandle.current = p.handle;
        setBio(p.bio ?? "");
        setWebsite(p.website ?? "");
        setPhone(p.phone ?? "");
        setAddress(p.address ?? "");
        setBannerPreview(p.bannerUrl);
      })
      .catch(() => toast.error("Failed to load page settings."));
  }, [pageId]);

  // Debounced handle-availability check. The provider's current handle is
  // always fine, so we skip the call (and clear any status) when unchanged.
  useEffect(() => {
    const trimmed = handle.trim();
    if (!trimmed || trimmed === savedHandle.current) {
      setHandleStatus("idle");
      return;
    }
    setHandleStatus("checking");
    const controller = new AbortController();
    const timer = setTimeout(() => {
      checkHandleAvailable(trimmed, controller.signal)
        .then((res) => setHandleStatus(res.available ? "available" : "taken"))
        .catch(() => {
          if (controller.signal.aborted) return;
          setHandleStatus("idle");
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [handle]);

  const handleBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerPreview(URL.createObjectURL(file));
    setBannerUploading(true);
    try {
      const res = await uploadMedia(file, MediaCategory.ProviderBanner);
      setBannerAssetId(res.assetId);
      if (res.url) setBannerPreview(res.url);
    } catch {
      toast.error("Failed to upload banner.");
      setBannerPreview(page?.bannerUrl ?? null);
    } finally {
      setBannerUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !handle.trim()) {
      toast.error("Name and handle are required.");
      return;
    }
    if (handleStatus === "taken") {
      toast.error("That handle is taken. Please choose another.");
      return;
    }
    setSaving(true);
    try {
      const updated = await updatePage(pageId, {
        name: name.trim(),
        handle: handle.trim(),
        bio: bio.trim() || null,
        website: website.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        bannerAssetId,
      });
      setLocal(updated);
      setPage(updated);
      toast.success("Settings saved.");
    } catch (err: unknown) {
      const body = (err as { response?: { data?: { error?: string } } })?.response?.data;
      toast.error(body?.error ?? "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (!page) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Page Settings" />

      <form onSubmit={handleSave}>
        <div className="flex flex-col gap-6 max-w-2xl">

          {/* Banner + Avatar hero */}
          <Panel className="overflow-hidden p-0">
            <div className="relative">
              {/* Banner — editable */}
              <label className="group block cursor-pointer">
                <div className="relative h-40 w-full bg-gray-100">
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="Banner" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400">
                      {bannerUploading ? "" : "Click to upload a banner"}
                    </div>
                  )}
                  {bannerUploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-800">
                        Change banner
                      </span>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleBannerFile} />
              </label>

              {/* Avatar — read-only, shows provider logo */}
              <div className="absolute -bottom-10 left-6">
                <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-sm">
                  {page.avatarUrl ? (
                    <img src={page.avatarUrl} alt={page.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">
                      Logo
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Spacer for avatar overflow */}
            <div className="h-14" />
          </Panel>

          {/* Identity */}
          <Panel className="p-6">
            <FormSection title="Identity">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Page name" required>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your shelter or rescue name"
                  />
                </FormField>

                <FormField
                  label="Handle"
                  required
                  hint={handleStatus === "idle" ? "Letters, numbers, underscores" : undefined}
                >
                  <InputWithPrefix
                    prefix="@"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="yourhandle"
                    wrapperClassName={cn(
                      handleStatus === "available" &&
                        "border-green-500 focus-within:ring-green-500",
                      handleStatus === "taken" &&
                        "border-red-500 focus-within:ring-red-500",
                    )}
                  />
                  {handleStatus === "checking" && (
                    <p className="text-xs text-gray-400">Checking availability...</p>
                  )}
                  {handleStatus === "available" && (
                    <p className="text-xs text-green-600">Available</p>
                  )}
                  {handleStatus === "taken" && (
                    <p className="text-xs text-red-500">This handle is taken.</p>
                  )}
                </FormField>
              </div>

              <FormField label="Bio" hint="Brief description shown on your public page">
                <FormTextarea
                  rows={3}
                  maxLength={300}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell people about your rescue..."
                />
              </FormField>
            </FormSection>
          </Panel>

          {/* Contact */}
          <Panel className="p-6">
            <FormSection title="Contact" description="Visible to users who want to reach you.">
              <FormField label="Website">
                <Input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yoursite.com"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Phone">
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555 000 0000"
                  />
                </FormField>

                <FormField label="Address">
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street, city"
                  />
                </FormField>
              </div>
            </FormSection>
          </Panel>

          <FormDivider />

          <div className="flex justify-end gap-3 pb-2">
            <Button
              type="submit"
              disabled={saving || bannerUploading || handleStatus === "taken" || handleStatus === "checking"}
            >
              {saving ? "Saving..." : bannerUploading ? "Uploading..." : "Save changes"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
