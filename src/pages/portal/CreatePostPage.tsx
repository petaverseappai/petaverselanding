import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createPost, uploadMedia } from "@/services/portal";
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
import type { MediaItem } from "@/components/portal/ui";

export default function PortalCreatePostPage() {
  const pageId = usePageId();
  const navigate = useNavigate();

  const [caption, setCaption] = useState("");
  const [locationName, setLocationName] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to upload media.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (assetId: string) => {
    setMedia((prev) => prev.filter((m) => m.assetId !== assetId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (media.length === 0) {
      toast.error("Add at least one photo or video.");
      return;
    }
    setSubmitting(true);
    try {
      await createPost(pageId, {
        caption: caption.trim() || undefined,
        locationName: locationName.trim() || undefined,
        media: media.map((m) => ({ mediaAssetId: m.assetId })),
      });
      toast.success("Post published.");
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
      <PageHeader title="New Post" />

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-6 max-w-xl">
          <Panel className="p-6">
            <div className="flex flex-col gap-6">
              <FormSection title="Media" description="Add photos or videos for this post.">
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

              <FormSection title="Details">
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

          <div className="flex justify-end gap-3 pb-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(ROUTES.PORTAL_POSTS)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || uploading}>
              {submitting ? "Publishing..." : "Publish post"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
