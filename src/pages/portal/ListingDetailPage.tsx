import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  getListing,
  getListingRequests,
  approveRequest,
  rejectRequest,
  completeTransfer,
  withdrawListing,
  deleteListing,
} from "@/services/portal";
import { ROUTES } from "@/constants/routes";
import {
  PageHeader, Panel, Tag, LoadingState, ConfirmModal,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { fmtDate, fmtDateTime } from "@/lib/adminFormat";
import type { ListingDetail, AdoptionRequest } from "@/types/portal.types";
import type { Tone } from "@/components/admin/ui";

const STATUS_AVAILABLE   = 16;
const STATUS_PENDING     = 17;
const STATUS_ADOPTED     = 18;
const STATUS_WITHDRAWN   = 19;

function statusTone(statusId: number): Tone {
  switch (statusId) {
    case STATUS_AVAILABLE: return "green";
    case STATUS_PENDING:   return "amber";
    case STATUS_ADOPTED:   return "blue";
    default:               return "gray";
  }
}

function isReadOnly(statusId: number) {
  return statusId === STATUS_ADOPTED || statusId === STATUS_WITHDRAWN;
}

export default function PortalListingDetailPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const id = Number(listingId);

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const reload = () => {
    setLoading(true);
    Promise.all([getListing(id), getListingRequests(id)])
      .then(([l, r]) => { setListing(l); setRequests(r); })
      .catch(() => toast.error("Failed to load listing."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, [id]);

  const act = async (action: () => Promise<void>, requestId?: number) => {
    setBusy(requestId ?? -1);
    try {
      await action();
      reload();
    } catch (err: unknown) {
      const body = (err as { response?: { data?: { error?: string } } })?.response?.data;
      toast.error(body?.error ?? "Action failed.");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Listing" />
        <LoadingState />
      </div>
    );
  }

  if (!listing) return null;

  const readOnly   = isReadOnly(listing.statusId);
  const isPending  = listing.statusId === STATUS_PENDING;
  const isAvail    = listing.statusId === STATUS_AVAILABLE;
  const canDelete  = isAvail || listing.statusId === STATUS_WITHDRAWN;

  return (
    <div className="space-y-6">
      <PageHeader
        title={listing.petName}
        subtitle={`Created ${fmtDate(listing.createdAt)}`}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.PORTAL_LISTINGS)}>
            Back to listings
          </Button>
        }
      />

      {/* Pet info card */}
      <Panel className="p-6">
        <div className="flex gap-6">
          {listing.photoUrl ? (
            <img
              src={listing.photoUrl}
              alt={listing.petName}
              className="h-36 w-36 shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <div className="h-36 w-36 shrink-0 rounded-2xl bg-gray-100" />
          )}

          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">{listing.petName}</h2>
              <Tag tone={statusTone(listing.statusId)}>{listing.statusName}</Tag>
            </div>

            <p className="text-sm text-gray-600">
              {[listing.speciesName, listing.breedName, listing.gender, listing.sizeName]
                .filter(Boolean)
                .join(" · ")}
            </p>

            {listing.locationLabel && (
              <p className="text-sm text-gray-500">{listing.locationLabel}</p>
            )}

            <div className="flex gap-4 text-xs text-gray-500">
              {listing.vaccinated  && <span>Vaccinated</span>}
              {listing.neutered    && <span>Neutered</span>}
              {listing.goodWithKids && <span>Good with kids</span>}
            </div>

            {listing.description && (
              <p className="mt-1 text-sm text-gray-700">{listing.description}</p>
            )}

            {(isAvail || canDelete) && (
              <div className="mt-3 flex gap-2">
                {isAvail && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    disabled={busy === -1}
                    onClick={() => setWithdrawOpen(true)}
                  >
                    {busy === -1 ? "Withdrawing..." : "Withdraw listing"}
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    disabled={busy === -1}
                    onClick={() => setDeleteOpen(true)}
                  >
                    Delete listing
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </Panel>

      {/* Applicants */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Applicants ({requests.length})
        </h3>

        {requests.length === 0 && (
          <p className="text-sm text-gray-400">No applicants yet.</p>
        )}

        {requests.map((req) => {
          const isApproved  = req.statusId === STATUS_PENDING;
          const canApprove  = isAvail && !readOnly && !isApproved;
          const canReject   = (isAvail || (isPending && isApproved)) && !readOnly;
          const canComplete = isPending && isApproved && req.adopterConfirmedAt != null && !readOnly;
          const isBusy      = busy === req.id;

          return (
            <Panel key={req.id} className="flex items-center gap-4 p-4">
              {req.userAvatarUrl ? (
                <img
                  src={req.userAvatarUrl}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                  {req.userName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{req.userName}</p>
                <p className="text-xs text-gray-400">
                  Applied {fmtDateTime(req.appliedAt)}
                </p>
                {isApproved && req.adopterConfirmedAt && (
                  <p className="text-xs text-emerald-600">Adopter confirmed</p>
                )}
                {isApproved && !req.adopterConfirmedAt && isPending && (
                  <p className="text-xs text-amber-600">Awaiting adopter confirmation</p>
                )}
              </div>

              <div className="flex shrink-0 gap-2">
                {readOnly && (
                  <span className="text-xs text-gray-400">Read only</span>
                )}
                {canComplete && (
                  <Button size="sm" disabled={isBusy} onClick={() => act(() => completeTransfer(id, req.id), req.id)}>
                    {isBusy ? "..." : "Complete"}
                  </Button>
                )}
                {canApprove && (
                  <Button variant="outline" size="sm" disabled={isBusy} onClick={() => act(() => approveRequest(id, req.id), req.id)}>
                    {isBusy ? "..." : "Approve"}
                  </Button>
                )}
                {canReject && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isBusy}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => act(() => rejectRequest(id, req.id), req.id)}
                  >
                    {isBusy ? "..." : "Reject"}
                  </Button>
                )}
              </div>
            </Panel>
          );
        })}
      </div>

      <ConfirmModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        onConfirm={() => act(() => withdrawListing(id))}
        title="Withdraw listing"
        message="This listing will be withdrawn and closed to new applicants. This cannot be undone."
        confirmLabel="Withdraw"
        danger
      />

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() =>
          act(async () => {
            await deleteListing(id);
            navigate(ROUTES.PORTAL_LISTINGS);
          })
        }
        title="Delete listing"
        message="This will permanently delete the listing and all its applicants. This cannot be undone."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
