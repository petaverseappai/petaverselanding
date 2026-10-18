import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createListing } from "@/services/portal";
import { usePageId } from "@/context/PortalPageContext";
import { ROUTES } from "@/constants/routes";
import { PageHeader, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { ListingForm } from "@/components/portal/ListingForm";
import type { ListingData } from "@/types/portal.types";

export default function PortalCreateListingPage() {
  const pageId = usePageId();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Partial<ListingData>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing.petName || !listing.speciesId || !listing.gender || !listing.photoAssetId) {
      toast.error("Pet name, species, gender, and photo are required.");
      return;
    }
    setSubmitting(true);
    try {
      await createListing(pageId, listing as ListingData);
      toast.success("Listing created.");
      navigate(ROUTES.PORTAL_LISTINGS);
    } catch (err: unknown) {
      const body = (err as { response?: { data?: { error?: string } } })?.response?.data;
      toast.error(body?.error ?? "Failed to create listing.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Adoption Listing"
        subtitle="Fill in the pet details to list them for adoption."
      />

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-6 max-w-xl">
          <Panel className="p-6">
            <ListingForm value={listing} onChange={setListing} />
          </Panel>

          <div className="flex justify-end gap-3 pb-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(ROUTES.PORTAL_LISTINGS)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create listing"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
