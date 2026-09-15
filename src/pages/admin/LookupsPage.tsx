import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  getLookupTypes,
  getLookupItems,
  createLookup,
  updateLookup,
  deleteLookup,
} from "@/services/admin";
import type { LookupType, LookupItem, LookupWriteRequest } from "@/types/admin.types";
import { ENUM_SEEDED_LOOKUPS } from "@/types/admin.types";
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
  Modal,
  Field,
  Textarea,
  ConfirmModal,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { errMessage } from "@/lib/adminFormat";
import { useDebounced } from "@/lib/useDebounced";

export default function LookupsPage() {
  const [types, setTypes] = useState<LookupType[]>([]);
  const [type, setType] = useState<LookupType | null>(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 350);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<LookupItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [editing, setEditing] = useState<LookupItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmItem, setConfirmItem] = useState<LookupItem | null>(null);

  useEffect(() => {
    getLookupTypes()
      .then((t) => {
        setTypes(t);
        setType(t[0] ?? null);
      })
      .catch((e) => toast.error(errMessage(e, "Failed to load lookup types.")));
  }, []);

  const load = () => {
    if (!type) return;
    setLoading(true);
    getLookupItems(type, { search: debouncedSearch || undefined, page, pageSize: 20 })
      .then((res) => {
        setItems(res.items);
        setTotalPages(res.totalPages);
        setTotalCount(res.totalCount);
      })
      .catch((e) => toast.error(errMessage(e, "Failed to load items.")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
  }, [type, debouncedSearch]);

  useEffect(load, [type, debouncedSearch, page]);

  const isEnumSeeded = type ? ENUM_SEEDED_LOOKUPS.includes(type) : false;

  const onDelete = async (item: LookupItem) => {
    if (!type) return;
    try {
      await deleteLookup(type, item.id);
      toast.success("Deleted.");
      load();
    } catch (e) {
      toast.error(errMessage(e, "Delete failed."));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reference data"
        subtitle="Manage master lookup tables."
        actions={
          type && !isEnumSeeded ? (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> New
            </Button>
          ) : null
        }
      />

      <div className="flex flex-wrap gap-1">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              t === type
                ? "bg-paw-orange text-white"
                : "bg-white text-gray-600 shadow-sm hover:bg-gray-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <Panel>
        <div className="flex items-center justify-between gap-2 p-4">
          <FilterBar>
            <TextField
              value={search}
              onChange={setSearch}
              placeholder="Search..."
              className="w-64"
            />
          </FilterBar>
          {isEnumSeeded && (
            <Tag tone="amber">Enum-seeded: rename only, no create/delete</Tag>
          )}
        </div>

        {loading ? (
          <EmptyState>Loading...</EmptyState>
        ) : items.length === 0 ? (
          <EmptyState>No items.</EmptyState>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH className="w-16">ID</TH>
                <TH>Name</TH>
                <TH>Extra</TH>
                <TH className="w-28" />
              </TR>
            </THead>
            <TBody>
              {items.map((item) => (
                <TR key={item.id}>
                  <TD className="text-gray-400">{item.id}</TD>
                  <TD className="font-medium text-gray-900">{item.name}</TD>
                  <TD className="text-xs text-gray-500">
                    {item.extra ? <ExtraSummary extra={item.extra} /> : "—"}
                  </TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditing(item)}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {!isEnumSeeded && (
                        <button
                          onClick={() => setConfirmItem(item)}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
        <Pagination page={page} totalPages={totalPages} totalCount={totalCount} onChange={setPage} />
      </Panel>

      {type && (
        <LookupModal
          open={creating || editing !== null}
          mode={creating ? "create" : "edit"}
          item={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSubmit={async (body) => {
            try {
              if (creating) {
                await createLookup(type, body);
                toast.success("Created.");
              } else if (editing) {
                await updateLookup(type, editing.id, body);
                toast.success("Updated.");
              }
              setCreating(false);
              setEditing(null);
              load();
            } catch (e) {
              toast.error(errMessage(e, "Save failed."));
            }
          }}
        />
      )}

      <ConfirmModal
        open={confirmItem !== null}
        onClose={() => setConfirmItem(null)}
        onConfirm={() => confirmItem && onDelete(confirmItem)}
        title="Delete item"
        message={`Delete "${confirmItem?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

function ExtraSummary({ extra }: { extra: Record<string, unknown> }) {
  return (
    <span className="font-mono">
      {Object.entries(extra)
        .map(([k, v]) => `${k}: ${String(v)}`)
        .join(", ")}
    </span>
  );
}

function LookupModal({
  open,
  mode,
  item,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  item: LookupItem | null;
  onClose: () => void;
  onSubmit: (body: LookupWriteRequest) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [extraText, setExtraText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(item?.name ?? "");
      setExtraText(item?.extra ? JSON.stringify(item.extra, null, 2) : "");
    }
  }, [open, item]);

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    let extra: Record<string, unknown> | null = null;
    if (extraText.trim()) {
      try {
        extra = JSON.parse(extraText);
      } catch {
        toast.error("Extra must be valid JSON.");
        return;
      }
    }
    setSaving(true);
    await onSubmit({ name: name.trim(), extra });
    setSaving(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "New item" : `Edit "${item?.name}"`}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name">
          <TextField value={name} onChange={setName} className="w-full" />
        </Field>
        <Field label="Extra (JSON, optional)">
          <Textarea
            value={extraText}
            onChange={setExtraText}
            rows={6}
            placeholder='{ "speciesId": 1, "origin": "Scotland" }'
            className="font-mono text-xs"
          />
        </Field>
      </div>
    </Modal>
  );
}
