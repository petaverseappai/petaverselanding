import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Check, ExternalLink, X } from "lucide-react";
import {
  getAdoptionListings,
  closeAdoptionListing,
  getAdoptionRequests,
  getTopAdoptionRequesters,
} from "@/services/admin";
import type {
  AdoptionListing,
  AdoptionRequestItem,
  AdoptionRequesterStat,
} from "@/types/admin.types";
import { ADOPTION_REQUEST_STATUSES } from "@/types/admin.types";
import {
  PageHeader,
  Panel,
  Table,
  THead,
  TBody,
  TH,
  TR,
  TD,
  Tag,
  type Tone,
  Pagination,
  EmptyState,
  LoadingState,
  FilterBar,
  TextField,
  SelectField,
  Modal,
  Field,
  Textarea,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { adminPaths } from "@/constants/routes";
import { fmtDate, fmtDateTime, errMessage, userStatusTone } from "@/lib/adminFormat";
import { useDebounced } from "@/lib/useDebounced";

const TYPE_OPTS = [
  { value: "rehome", label: "Rehome" },
  { value: "shelter_stray", label: "Shelter / Stray" },
];

// Listing lifecycle StatusCode ids (16-19).
const LISTING_STATUS_OPTS = [
  { value: "16", label: "Available" },
  { value: "17", label: "Pending transfer" },
  { value: "18", label: "Adopted" },
  { value: "19", label: "Withdrawn" },
];

const REQUEST_STATUS_OPTS =ADOPTION_REQUEST_STATUSES.map((s) => ({
  value: String(s.id),
  label: s.label,
}));

// Must match UnansweredAfterDays in the API's AdminOversightService.
const UNANSWERED_AFTER_DAYS = 3;

// A requester with this many open (pending + approved) requests is worth a look.
const MANY_OPEN_REQUESTS = 5;

type Tab = "listings" | "requests";
type ListingFilter = { id: number; petName: string };
type RequesterFilter = { id: string; name: string };

export default function AdoptionPage() {
  const [tab, setTab] = useState<Tab>("listings");
  const [listingFilter, setListingFilter] = useState<ListingFilter | null>(null);
  const [requesterFilter, setRequesterFilter] = useState<RequesterFilter | null>(null);

  const showRequestsFor = (l: AdoptionListing) => {
    setListingFilter({ id: l.id, petName: l.petName });
    setRequesterFilter(null);
    setTab("requests");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Adoption" subtitle="Oversee adoption listings and the requests on them." />

      <div className="flex gap-1">
        {(["listings", "requests"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              t === tab
                ? "bg-paw-orange text-white"
                : "bg-white text-gray-600 shadow-sm hover:bg-gray-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "listings" ? (
        <ListingsTab onShowRequests={showRequestsFor} />
      ) : (
        <RequestsTab
          listing={listingFilter}
          onListingChange={setListingFilter}
          requester={requesterFilter}
          onRequesterChange={setRequesterFilter}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

function ListingsTab({ onShowRequests }: { onShowRequests: (l: AdoptionListing) => void }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 350);
  const [type, setType] = useState("");
  const [statusId, setStatusId] = useState("");
  const [unanswered, setUnanswered] = useState(false);
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<AdoptionListing[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [closing, setClosing] = useState<AdoptionListing | null>(null);

  const load = () => {
    setLoading(true);
    getAdoptionListings({
      search: debouncedSearch || undefined,
      type: (type || undefined) as "rehome" | "shelter_stray" | undefined,
      status: statusId === "" ? undefined : Number(statusId),
      unanswered,
      page,
      pageSize: 20,
    })
      .then((res) => {
        setItems(res.items);
        setTotalPages(res.totalPages);
        setTotalCount(res.totalCount);
      })
      .catch((e) => toast.error(errMessage(e, "Failed to load listings.")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, type, statusId, unanswered]);

  useEffect(load, [debouncedSearch, type, statusId, unanswered, page]);

  return (
    <>
      <Panel>
        <div className="p-4">
          <FilterBar>
            <TextField
              value={search}
              onChange={setSearch}
              placeholder="Search..."
              className="w-64"
            />
            <SelectField value={type} onChange={setType} options={TYPE_OPTS} placeholder="Any type" />
            <SelectField
              value={statusId}
              onChange={setStatusId}
              options={LISTING_STATUS_OPTS}
              placeholder="Any status"
            />
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <Checkbox checked={unanswered} onChange={(e) => setUnanswered(e.target.checked)} />
              Unanswered requests ({UNANSWERED_AFTER_DAYS}+ days)
            </label>
          </FilterBar>
        </div>

        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState>No listings match these filters.</EmptyState>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Pet</TH>
                <TH>Type</TH>
                <TH>Lister</TH>
                <TH>Status</TH>
                <TH>Requests</TH>
                <TH>Location</TH>
                <TH>Created</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {items.map((l) => (
                <TR key={l.id}>
                  <TD className="font-medium text-gray-900">
                    {l.petName} <span className="text-gray-400">#{l.petId}</span>
                  </TD>
                  <TD>
                    <Tag tone="blue">{l.type}</Tag>
                  </TD>
                  <TD>{l.listerName}</TD>
                  <TD>
                    <Tag tone="gray">{l.statusName}</Tag>
                  </TD>
                  <TD>
                    <RequestCountCell listing={l} onClick={() => onShowRequests(l)} />
                  </TD>
                  <TD>{l.locationLabel ?? "—"}</TD>
                  <TD className="whitespace-nowrap text-gray-500">{fmtDate(l.createdAt)}</TD>
                  <TD>
                    <Button variant="outline" size="sm" onClick={() => setClosing(l)}>
                      Close
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
        <Pagination page={page} totalPages={totalPages} totalCount={totalCount} onChange={setPage} />
      </Panel>

      <CloseModal
        listing={closing}
        onClose={() => setClosing(null)}
        onDone={() => {
          setClosing(null);
          load();
        }}
      />
    </>
  );
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function RequestCountCell({ listing, onClick }: { listing: AdoptionListing; onClick: () => void }) {
  if (listing.requestCount === 0) return <span className="text-gray-300">0</span>;
  const waitingDays = listing.oldestPendingRequestAt ? daysSince(listing.oldestPendingRequestAt) : 0;
  return (
    <button onClick={onClick} className="text-left hover:text-paw-orange" title="View requests">
      <span className="font-medium text-gray-900">{listing.requestCount}</span>
      {listing.pendingRequestCount > 0 && (
        <span className="ml-1 text-xs text-gray-500">({listing.pendingRequestCount} pending)</span>
      )}
      {waitingDays >= UNANSWERED_AFTER_DAYS && (
        <div className="mt-0.5">
          <Tag tone="amber">Waiting {waitingDays}d</Tag>
        </div>
      )}
    </button>
  );
}

function CloseModal({
  listing,
  onClose,
  onDone,
}: {
  listing: AdoptionListing | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (listing) setReason("");
  }, [listing]);

  return (
    <Modal
      open={listing !== null}
      onClose={onClose}
      title={`Close listing for ${listing?.petName ?? ""}`}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={saving}
            onClick={async () => {
              if (!listing) return;
              setSaving(true);
              try {
                await closeAdoptionListing(listing.id, reason);
                toast.success("Listing closed.");
                onDone();
              } catch (e) {
                toast.error(errMessage(e, "Failed to close."));
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Closing..." : "Close listing"}
          </Button>
        </>
      }
    >
      <Field label="Reason">
        <Textarea value={reason} onChange={setReason} placeholder="Why is this being closed?" />
      </Field>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

function requestStatusTone(statusId: number | null): Tone {
  switch (statusId) {
    case 10:
      return "amber"; // Pending
    case 11:
      return "blue"; // Approved
    case 14:
      return "green"; // Completed
    default:
      return "gray"; // Rejected / Cancelled / Expired
  }
}

function RequestsTab({
  listing,
  onListingChange,
  requester,
  onRequesterChange,
}: {
  listing: ListingFilter | null;
  onListingChange: (l: ListingFilter | null) => void;
  requester: RequesterFilter | null;
  onRequesterChange: (r: RequesterFilter | null) => void;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 350);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<AdoptionRequestItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [top, setTop] = useState<AdoptionRequesterStat[] | null>(null);

  useEffect(() => {
    getTopAdoptionRequesters(7)
      .then(setTop)
      .catch((e) => toast.error(errMessage(e, "Failed to load top requesters.")));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, listing, requester]);

  useEffect(() => {
    setLoading(true);
    getAdoptionRequests({
      search: debouncedSearch || undefined,
      status: status ? Number(status) : undefined,
      listingId: listing?.id,
      requesterId: requester?.id,
      page,
      pageSize: 20,
    })
      .then((res) => {
        setItems(res.items);
        setTotalPages(res.totalPages);
        setTotalCount(res.totalCount);
      })
      .catch((e) => toast.error(errMessage(e, "Failed to load requests.")))
      .finally(() => setLoading(false));
  }, [debouncedSearch, status, listing, requester, page]);

  return (
    <>
      <Panel>
        <div className="p-4">
          <p className="text-sm font-semibold text-gray-900">Most requests (last 7 days)</p>
          <p className="mb-3 text-xs text-gray-400">
            Many requests across many listings, especially from new accounts, can mean spam or a
            scam.
          </p>
          {top === null ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : top.length === 0 ? (
            <p className="text-sm text-gray-400">No adoption requests in the last 7 days.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {top.map((u) => (
                <button
                  key={u.userId}
                  onClick={() => onRequesterChange({ id: u.userId, name: u.name ?? u.userCode })}
                  className="rounded-xl border border-gray-100 px-3 py-2 text-left text-sm hover:border-paw-orange/40 hover:bg-gray-50"
                  title="Show this user's requests"
                >
                  <span className="font-medium text-gray-900">{u.name ?? u.userCode}</span>
                  {u.status !== "Active" && (
                    <span className="ml-1">
                      <Tag tone={userStatusTone(u.status)}>{u.status}</Tag>
                    </span>
                  )}
                  <span className="block text-xs text-gray-500">
                    {u.requests} request(s) · {u.distinctListings} listing(s) · joined{" "}
                    {fmtDate(u.createdAt)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Panel>

      <Panel>
        <div className="space-y-3 p-4">
          <FilterBar>
            <TextField
              value={search}
              onChange={setSearch}
              placeholder="Pet, requester name or user code..."
              className="w-72"
            />
            <SelectField
              value={status}
              onChange={setStatus}
              options={REQUEST_STATUS_OPTS}
              placeholder="Any status"
            />
          </FilterBar>
          {(listing || requester) && (
            <div className="flex flex-wrap gap-2">
              {listing && (
                <Chip
                  label={`Listing: ${listing.petName} #${listing.id}`}
                  onClear={() => onListingChange(null)}
                />
              )}
              {requester && (
                <Chip label={`Requester: ${requester.name}`} onClear={() => onRequesterChange(null)} />
              )}
            </div>
          )}
        </div>

        {loading ? (
          <EmptyState>Loading...</EmptyState>
        ) : items.length === 0 ? (
          <EmptyState>No requests match these filters.</EmptyState>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Pet</TH>
                <TH>Requester</TH>
                <TH>Lister</TH>
                <TH>Status</TH>
                <TH>Requested</TH>
                <TH>Handover</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((r) => (
                <TR key={r.id}>
                  <TD>
                    {r.listingId ? (
                      <button
                        onClick={() =>
                          onListingChange({ id: r.listingId!, petName: r.petName ?? "Listing" })
                        }
                        className="font-medium text-gray-900 hover:text-paw-orange"
                        title="Show only this listing's requests"
                      >
                        {r.petName ?? "—"} <span className="text-gray-400">#{r.listingId}</span>
                      </button>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                    {r.listingStatusName && (
                      <div className="mt-0.5 text-xs text-gray-400">Listing: {r.listingStatusName}</div>
                    )}
                  </TD>
                  <TD>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          onRequesterChange({
                            id: r.requesterUserId,
                            name: r.requesterName ?? r.requesterCode,
                          })
                        }
                        className="text-gray-900 hover:text-paw-orange"
                        title="Show only this user's requests"
                      >
                        {r.requesterName ?? r.requesterCode}
                      </button>
                      <Link
                        to={adminPaths.userDetail(r.requesterUserId)}
                        className="text-gray-400 hover:text-gray-700"
                        title="Open user"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
                      <span className="font-mono">{r.requesterCode}</span>
                      <span>· joined {fmtDate(r.requesterCreatedAt)}</span>
                      {r.requesterStatus !== "Active" && (
                        <Tag tone={userStatusTone(r.requesterStatus)}>{r.requesterStatus}</Tag>
                      )}
                      {r.requesterOpenRequests >= MANY_OPEN_REQUESTS && (
                        <Tag tone="amber">{r.requesterOpenRequests} open requests</Tag>
                      )}
                    </div>
                  </TD>
                  <TD>
                    {r.listerUserId ? (
                      <Link
                        to={adminPaths.userDetail(r.listerUserId)}
                        className="text-gray-700 hover:text-paw-orange"
                      >
                        {r.listerName ?? "—"}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TD>
                  <TD>
                    <Tag tone={requestStatusTone(r.statusId)}>{r.statusName ?? "—"}</Tag>
                  </TD>
                  <TD className="whitespace-nowrap text-gray-500">
                    {fmtDateTime(r.requestedAt)}
                    {r.statusId === 10 && daysSince(r.requestedAt) >= UNANSWERED_AFTER_DAYS && (
                      <div className="mt-0.5">
                        <Tag tone="amber">Waiting {daysSince(r.requestedAt)}d</Tag>
                      </div>
                    )}
                  </TD>
                  <TD>
                    {r.statusId === 11 || r.statusId === 14 ? (
                      <div className="space-y-0.5 text-xs">
                        <Confirmed label="Lister" at={r.listerConfirmedAt} />
                        <Confirmed label="Adopter" at={r.adopterConfirmedAt} />
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
        <Pagination page={page} totalPages={totalPages} totalCount={totalCount} onChange={setPage} />
      </Panel>
    </>
  );
}

function Confirmed({ label, at }: { label: string; at: string | null }) {
  return at ? (
    <div className="flex items-center gap-1 text-emerald-700" title={fmtDateTime(at)}>
      <Check className="h-3.5 w-3.5" /> {label} confirmed
    </div>
  ) : (
    <div className="text-gray-400">{label} not yet</div>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-paw-orange/10 py-1 pl-3 pr-1.5 text-xs font-medium text-paw-orange">
      {label}
      <button onClick={onClear} className="rounded-full p-0.5 hover:bg-paw-orange/20" title="Clear">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
