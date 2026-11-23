import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createPostWithListing, uploadMedia } from "@/services/portal";
import { MediaCategory } from "@/constants/mediaCategory";
import { usePageId } from "@/context/PortalPageContext";
import { ROUTES } from "@/constants/routes";
import { PageHeader, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormTextarea,
  FormSection,
  FormDivider,
  MediaUploader,
} from "@/components/portal/ui";
import { ListingForm } from "@/components/portal/ListingForm";
import type { MediaItem } from "@/components/portal/ui";
import type { ListingData } from "@/types/portal.types";

export default function PortalCreatePostWithListingPage() {
  const pageId = usePageId();
  const navigate = useNavigate();

  const [caption, setCaption] = useState("");
  const [locationName, setLocationName] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [listing, setListing] = useState<Partial<ListingData>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async (files: File[]) => {
    setUploading(true);
    try {
      const results = await Promise.all(
        files.map(async (file) => {
          const localPreview = URL.createObjectURL(file);
          const res = await uploadMedia(file, MediaCategory.Post);
          return { assetId: res.assetId, preview: res.url ?? localPreview };
        }),
      );
      setMedia((prev) => [...prev, ...results]);
    } catch {
      toast.error("Failed to upload media.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (assetId: string) => {
    setMedia((prev) => prev.filter((m) => m.assetId !== assetId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing.petName || !listing.speciesId || !listing.gender || !listing.photoAssetId) {
      toast.error("Complete the listing — pet name, species, gender, and photo are required.");
      return;
    }
    if (media.length === 0) {
      toast.error("Add at least one photo or video for the post.");
      return;
    }
    setSubmitting(true);
    try {
      await createPostWithListing(pageId, {
        listing: listing as ListingData,
        caption: caption.trim() || undefined,
        locationName: locationName.trim() || undefined,
        media: media.map((m) => ({ mediaAssetId: m.assetId })),
      });
      toast.success("Post and listing published.");
      navigate(ROUTES.PORTAL_POSTS);
    } catch (err: unknown) {
      const body = (err as { response?: { data?: { error?: string } } })?.response?.data;
      toast.error(body?.error ?? "Failed to create post.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Post + Adoption Listing"
        subtitle="Publish a post and create an adoption listing at the same time."
      />

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-6 max-w-xl">
          {/* Post section */}
          <Panel className="p-6">
            <div className="flex flex-col gap-6">
              <FormSection title="Post media" description="Photos or videos for your post.">
                <MediaUploader
                  items={media}
                  onAdd={handleAdd}
                  onRemove={handleRemove}
                  uploading={uploading}
                  accept="image/*,video/*"
                  multiple
                />
              </FormSection>

              <FormDivider />

              <FormSection title="Post details">
                <FormField label="Caption">
                  <FormTextarea
                    rows={3}
                    maxLength={2200}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Share something about this pet..."
                  />
                </FormField>

                <FormField label="Location" hint="Optional — city or place name">
                  <Input
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g. Beirut"
                  />
                </FormField>
              </FormSection>
            </div>
          </Panel>

          {/* Listing section */}
          <Panel className="p-6">
            <div className="mb-2">
              <h2 className="text-sm font-semibold text-gray-900">Adoption listing</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Provide the pet details — the listing photo is separate from your post media.
              </p>
            </div>
            <div className="mt-5">
              <ListingForm value={listing} onChange={setListing} />
            </div>
          </Panel>

          <div className="flex justify-end gap-3 pb-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(ROUTES.PORTAL_POSTS)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || uploading}>
              {submitting ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
