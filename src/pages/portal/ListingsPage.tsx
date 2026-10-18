import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getListings } from "@/services/portal";
import { usePageId } from "@/context/PortalPageContext";
import { ROUTES, portalPaths } from "@/constants/routes";
import {
  PageHeader, Panel, Table, THead, TH, TBody, TR, TD,
  Tag, LoadingState, EmptyState,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { fmtDate } from "@/lib/adminFormat";
import type { ListingListItem } from "@/types/portal.types";
import type { Tone } from "@/components/admin/ui";

const STATUS_TABS = [
  { label: "All",       statusId: undefined },
  { label: "Available", statusId: 16 },
  { label: "Pending",   statusId: 17 },
  { label: "Adopted",   statusId: 18 },
  { label: "Withdrawn", statusId: 19 },
] as const;

function statusTone(statusId: number): Tone {
  switch (statusId) {
    case 16: return "green";
    case 17: return "amber";
    case 18: return "blue";
    default: return "gray";
  }
}

export default function PortalListingsPage() {
  const pageId = usePageId();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<number | undefined>(undefined);
  const [items, setItems] = useState<ListingListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = (statusId?: number) => {
    setLoading(true);
    getListings(pageId, { statusId })
      .then(setItems)
      .catch(() => toast.error("Failed to load listings."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(activeTab); }, [pageId, activeTab]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Listings"
        subtitle="Manage your adoption listings."
        actions={
          <Button size="sm" onClick={() => navigate(ROUTES.PORTAL_LISTINGS_NEW)}>
            New listing
          </Button>
        }
      />

      <Panel>
        <div className="flex gap-1 border-b border-gray-100 px-4 pt-3 pb-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.statusId)}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.statusId
                  ? "border-b-2 border-paw-blue text-paw-blue"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState>No listings found.</EmptyState>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Pet</TH>
                <TH>Species</TH>
                <TH>Location</TH>
                <TH>Applicants</TH>
                <TH>Status</TH>
                <TH>Created</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((listing) => (
                <TR
                  key={listing.id}
                  onClick={() => navigate(portalPaths.listingDetail(listing.id))}
                >
                  <TD className="font-medium text-gray-900">{listing.petName}</TD>
                  <TD>{listing.speciesName ?? "—"}</TD>
                  <TD>{listing.locationLabel ?? "—"}</TD>
                  <TD>{listing.applicantCount}</TD>
                  <TD>
                    <Tag tone={statusTone(listing.statusId)}>{listing.statusName}</Tag>
                  </TD>
                  <TD className="whitespace-nowrap text-gray-500">{fmtDate(listing.createdAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Panel>
    </div>
  );
}
