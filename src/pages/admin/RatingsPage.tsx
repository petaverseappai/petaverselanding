import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Star, Trash2, X, ExternalLink } from "lucide-react";
import { getRatings, getRatingSummary, deleteRatings } from "@/services/admin";
import type {
  AdminRatingItem,
  AdminRatingSummary,
  AdminRatingProviderStat,
  RatingFlag,
  RatingSort,
} from "@/types/admin.types";
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
import { Checkbox } from "@/components/ui/checkbox";
import { adminPaths } from "@/constants/routes";
import { fmtDate, fmtDateTime, fmtNumber, errMessage, userStatusTone } from "@/lib/adminFormat";
import { useDebounced } from "@/lib/useDebounced";

const STAR_OPTS = [5, 4, 3, 2, 1].map((s) => ({ value: String(s), label: `${s} star${s > 1 ? "s" : ""}` }));

const FLAG_OPTS = [
  { value: "any", label: "Any flag" },
  { value: "new_account", label: "New account" },
  { value: "restricted_user", label: "Suspended / banned" },
];

const SORT_OPTS: { value: RatingSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "stars_asc", label: "Lowest stars" },
  { value: "stars_desc", label: "Highest stars" },
];

const FLAG_LABELS: Record<RatingFlag, string> = {
  new_account: "New account",
  restricted_user: "Restricted user",
};

type ProviderFilter = { id: number; name: string };
type UserFilter = { id: string; name: string };

export default function RatingsPage() {
  const [summary, setSummary] = useState<AdminRatingSummary | null>(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 350);
  const [stars, setStars] = useState("");
  const [flag, setFlag] = useState("");
  const [sort, setSort] = useState<RatingSort>("newest");
  const [provider, setProvider] = useState<ProviderFilter | null>(null);
  const [user, setUser] = useState<UserFilter | null>(null);
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<AdminRatingItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState<AdminRatingItem[] | null>(null);

  const loadSummary = () => {
    getRatingSummary()
      .then(setSummary)
      .catch((e) => toast.error(errMessage(e, "Failed to load rating summary.")));
  };

  const load = () => {
    setLoading(true);
    getRatings({
      search: debouncedSearch || undefined,
      stars: stars ? Number(stars) : undefined,
      flag: (flag || undefined) as RatingFlag | "any" | undefined,
      sort,
      providerId: provider?.id,
      userId: user?.id,
      page,
      pageSize: 20,
    })
      .then((res) => {
        setItems(res.items);
        setTotalPages(res.totalPages);
        setTotalCount(res.totalCount);
        setSelected(new Set());
      })
      .catch((e) => toast.error(errMessage(e, "Failed to load ratings.")))
      .finally(() => setLoading(false));
  };

  useEffect(loadSummary, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, stars, flag, sort, provider, user]);

  useEffect(load, [debouncedSearch, stars, flag, sort, provider, user, page]);

  const filterProvider = (p: ProviderFilter) => {
    setProvider(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ratings"
        subtitle="Service provider star ratings. Spot rating abuse and remove bad ratings."
      />

      {summary && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Total ratings" value={fmtNumber(summary.total)} />
            <Stat
              label="Average"
              value={
                <span className="inline-flex items-center gap-1">
                  {summary.average.toFixed(2)}
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                </span>
              }
            />
            <Stat label="Last 7 days" value={fmtNumber(summary.last7Days)} />
            <Stat
              label="Flagged"
              value={fmtNumber(summary.flagged)}
              hint="New-account or suspended/banned raters"
              onClick={summary.flagged > 0 ? () => setFlag("any") : undefined}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel>
              <div className="p-4">
                <p className="mb-3 text-sm font-semibold text-gray-900">Star distribution</p>
                <Distribution counts={summary.distribution} onPick={(s) => setStars(String(s))} />
              </div>
            </Panel>
            <ProviderList
              title="Unusual spikes (last 7 days)"
              empty="No unusual rating activity."
              hint="At least 5 ratings this week and 3× the provider's usual weekly rate."
              stats={summary.spiking}
              metric={(p) => `${p.last7Days} this week · ${p.last7DaysAverage?.toFixed(1) ?? "—"}★ avg`}
              onPick={filterProvider}
            />
            <ProviderList
              title="Lowest rated"
              empty="No provider has 3+ ratings yet."
              hint="Providers with at least 3 ratings."
              stats={summary.lowestRated}
              metric={(p) => `${p.average.toFixed(2)}★ · ${p.count} rating(s)`}
              onPick={filterProvider}
            />
          </div>
        </>
      )}

      <Panel>
        <div className="space-y-3 p-4">
          <FilterBar>
            <TextField
              value={search}
              onChange={setSearch}
              placeholder="Provider, rater name or user code..."
              className="w-72"
            />
            <SelectField value={stars} onChange={setStars} options={STAR_OPTS} placeholder="Any stars" />
            <SelectField value={flag} onChange={setFlag} options={FLAG_OPTS} placeholder="All ratings" />
            <SelectField
              value={sort}
              onChange={(v) => setSort(v as RatingSort)}
              options={SORT_OPTS}
            />
          </FilterBar>
          {(provider || user) && (
            <div className="flex flex-wrap gap-2">
              {provider && (
                <Chip label={`Provider: ${provider.name}`} onClear={() => setProvider(null)} />
              )}
              {user && <Chip label={`Rater: ${user.name}`} onClear={() => setUser(null)} />}
            </div>
          )}
          {selected.size > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-2">
              <span className="text-sm text-red-700">{selected.size} rating(s) selected</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDeleting(items.filter((i) => selected.has(i.id)))}
              >
                <Trash2 className="h-4 w-4" /> Delete selected
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <EmptyState>Loading...</EmptyState>
        ) : items.length === 0 ? (
          <EmptyState>No ratings match these filters.</EmptyState>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH className="w-10">
                  <Checkbox checked={allSelected} onChange={toggleAll} aria-label="Select all" />
                </TH>
                <TH>Provider</TH>
                <TH>Rater</TH>
                <TH>Stars</TH>
                <TH>Flags</TH>
                <TH>Rated</TH>
                <TH className="w-12" />
              </TR>
            </THead>
            <TBody>
              {items.map((r) => (
                <TR key={r.id}>
                  <TD>
                    <Checkbox
                      checked={selected.has(r.id)}
                      onChange={() => toggle(r.id)}
                      aria-label={`Select rating ${r.id}`}
                    />
                  </TD>
                  <TD>
                    {r.providerId ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => filterProvider({ id: r.providerId!, name: r.providerName ?? `#${r.providerId}` })}
                          className="font-medium text-gray-900 hover:text-paw-orange"
                          title="Show only this provider's ratings"
                        >
                          {r.providerName ?? `#${r.providerId}`}
                        </button>
                        <Link
                          to={adminPaths.serviceProviderDetail(r.providerId)}
                          className="text-gray-400 hover:text-gray-700"
                          title="Open provider"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TD>
                  <TD>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setUser({ id: r.userId, name: r.userName })}
                        className="text-gray-900 hover:text-paw-orange"
                        title="Show only this rater's ratings"
                      >
                        {r.userName}
                      </button>
                      <Link
                        to={adminPaths.userDetail(r.userId)}
                        className="text-gray-400 hover:text-gray-700"
                        title="Open user"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400">
                      <span className="font-mono">{r.userCode}</span>
                      <span>· joined {fmtDate(r.userCreatedAt)}</span>
                      {r.userStatus !== "Active" && (
                        <Tag tone={userStatusTone(r.userStatus)}>{r.userStatus}</Tag>
                      )}
                    </div>
                  </TD>
                  <TD>
                    <Stars value={r.stars} />
                  </TD>
                  <TD>
                    <div className="flex flex-wrap gap-1">
                      {r.flags.length === 0 ? (
                        <span className="text-gray-300">—</span>
                      ) : (
                        r.flags.map((f) => (
                          <Tag key={f} tone={f === "restricted_user" ? "red" : "amber"}>
                            {FLAG_LABELS[f] ?? f}
                          </Tag>
                        ))
                      )}
                    </div>
                  </TD>
                  <TD className="whitespace-nowrap text-gray-500">{fmtDateTime(r.ratedAt)}</TD>
                  <TD>
                    <button
                      onClick={() => setDeleting([r])}
                      className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                      title="Delete rating"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
        <Pagination page={page} totalPages={totalPages} totalCount={totalCount} onChange={setPage} />
      </Panel>

      <DeleteModal
        ratings={deleting}
        onClose={() => setDeleting(null)}
        onDone={() => {
          setDeleting(null);
          load();
          loadSummary();
        }}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  onClick?: () => void;
}) {
  const body = (
    <>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </>
  );
  const cls = "rounded-xl border border-gray-100 bg-white p-4 text-left shadow-sm";
  return onClick ? (
    <button onClick={onClick} className={`${cls} transition-colors hover:border-paw-orange/40`}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex" aria-label={`${value} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= value ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
        />
      ))}
    </span>
  );
}

function Distribution({ counts, onPick }: { counts: number[]; onPick: (stars: number) => void }) {
  const max = Math.max(1, ...counts);
  return (
    <div className="space-y-1.5">
      {[5, 4, 3, 2, 1].map((s) => {
        const n = counts[s - 1] ?? 0;
        return (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="flex w-full items-center gap-2 text-xs text-gray-600 hover:text-gray-900"
            title={`Show ${s}-star ratings`}
          >
            <span className="w-6 text-right">{s}★</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
              <span
                className="block h-full rounded-full bg-amber-400"
                style={{ width: `${(n / max) * 100}%` }}
              />
            </span>
            <span className="w-12 text-right tabular-nums">{fmtNumber(n)}</span>
          </button>
        );
      })}
    </div>
  );
}

function ProviderList({
  title,
  empty,
  hint,
  stats,
  metric,
  onPick,
}: {
  title: string;
  empty: string;
  hint: string;
  stats: AdminRatingProviderStat[];
  metric: (p: AdminRatingProviderStat) => string;
  onPick: (p: ProviderFilter) => void;
}) {
  return (
    <Panel>
      <div className="p-4">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="mb-3 text-xs text-gray-400">{hint}</p>
        {stats.length === 0 ? (
          <p className="text-sm text-gray-400">{empty}</p>
        ) : (
          <ul className="space-y-1">
            {stats.map((p) => (
              <li key={p.providerId}>
                <button
                  onClick={() => onPick({ id: p.providerId, name: p.name })}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-gray-50"
                >
                  <span className="truncate font-medium text-gray-900">{p.name}</span>
                  <span className="whitespace-nowrap text-xs text-gray-500">{metric(p)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
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

function DeleteModal({
  ratings,
  onClose,
  onDone,
}: {
  ratings: AdminRatingItem[] | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ratings) setReason("");
  }, [ratings]);

  const count = ratings?.length ?? 0;
  const single = count === 1 ? ratings![0] : null;

  return (
    <Modal
      open={ratings !== null}
      onClose={onClose}
      title={count === 1 ? "Delete rating" : `Delete ${count} ratings`}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={saving}
            className="bg-red-600 hover:bg-red-700"
            onClick={async () => {
              if (!ratings) return;
              setSaving(true);
              try {
                const res = await deleteRatings(
                  ratings.map((r) => r.id),
                  reason.trim(),
                );
                toast.success(`Deleted ${res.deleted} rating(s).`);
                onDone();
              } catch (e) {
                toast.error(errMessage(e, "Delete failed."));
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Deleting..." : "Delete"}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm text-gray-600">
        {single ? (
          <p>
            Delete <b>{single.userName}</b>'s {single.stars}★ rating of{" "}
            <b>{single.providerName ?? "this provider"}</b>?
          </p>
        ) : (
          <p>Delete the {count} selected ratings?</p>
        )}
        <p className="text-xs text-gray-500">
          Provider averages update immediately. This can't be undone, and the user can still rate
          again later. Suspend or ban the account to stop repeat abuse.
        </p>
        <Field label="Reason (saved in the audit log)">
          <Textarea value={reason} onChange={setReason} placeholder="e.g. Rating spam from new accounts" rows={3} />
        </Field>
      </div>
    </Modal>
  );
}
