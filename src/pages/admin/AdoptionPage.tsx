import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getAdoptionListings, closeAdoptionListing } from "@/services/admin";
import type { AdoptionListing } from "@/types/admin.types";
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
  Pagination,
  EmptyState,
  FilterBar,
  TextField,
  SelectField,
  Modal,
  Field,
  Textarea,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { fmtDate, errMessage } from "@/lib/adminFormat";
import { useDebounced } from "@/lib/useDebounced";

const TYPE_OPTS = [
  { value: "rehome", label: "Rehome" },
  { value: "shelter_stray", label: "Shelter / Stray" },
];

export default function AdoptionPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 350);
  const [type, setType] = useState("");
  const [statusId, setStatusId] = useState("");
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
  }, [debouncedSearch, type, statusId]);

  useEffect(load, [debouncedSearch, type, statusId, page]);

  return (
    <div className="space-y-6">
      <PageHeader title="Adoption" subtitle="Oversee active adoption listings." />

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
            <TextField
              value={statusId}
              onChange={setStatusId}
              placeholder="Status ID"
              type="number"
              className="w-32"
            />
          </FilterBar>
        </div>

        {loading ? (
          <EmptyState>Loading...</EmptyState>
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
    </div>
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
