import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, Download } from "lucide-react";
import {
  getLookupTypes,
  getLookupItems,
  createLookup,
  updateLookup,
  deleteLookup,
  importLookups,
} from "@/services/admin";
import type {
  LookupType,
  LookupItem,
  LookupWriteRequest,
  LookupImportResult,
} from "@/types/admin.types";
import { ENUM_SEEDED_LOOKUPS, LOOKUP_IMPORT_COLUMNS } from "@/types/admin.types";
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
  LoadingState,
  FilterBar,
  TextField,
  Modal,
  Field,
  Textarea,
  ConfirmModal,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { errMessage, camelToTitle, extractBooleanFields } from "@/lib/adminFormat";
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
  const [importing, setImporting] = useState(false);

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
  const canImport = type ? LOOKUP_IMPORT_COLUMNS[type] !== undefined : false;

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
            <div className="flex gap-2">
              {canImport && (
                <Button size="sm" variant="outline" onClick={() => setImporting(true)}>
                  <Upload className="h-4 w-4" /> Import
                </Button>
              )}
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> New
              </Button>
            </div>
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
          <LoadingState />
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

      {type && (
        <ImportModal
          open={importing}
          type={type}
          onClose={() => setImporting(false)}
          onImported={() => {
            setImporting(false);
            load();
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
    <span className="space-y-1">
      {Object.entries(extra).map(([k, v]) => {
        if (typeof v === "boolean") {
          return (
            <div key={k} className="flex items-center gap-1 text-xs">
              <span className="font-medium">{camelToTitle(k)}:</span>
              <span className={v ? "text-green-600" : "text-gray-400"}>
                {v ? "✓ Yes" : "✗ No"}
              </span>
            </div>
          );
        }
        return (
          <div key={k} className="font-mono text-xs">
            {k}: {String(v)}
          </div>
        );
      })}
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
  const [booleans, setBooleans] = useState<Record<string, boolean>>({});
  const [otherExtra, setOtherExtra] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(item?.name ?? "");
      const boolFields = extractBooleanFields(item?.extra ?? null);
      setBooleans(boolFields);

      const other: Record<string, unknown> = {};
      if (item?.extra) {
        Object.entries(item.extra).forEach(([k, v]) => {
          if (typeof v !== "boolean") {
            other[k] = v;
          }
        });
      }
      setOtherExtra(other);
    }
  }, [open, item]);

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    const extra = Object.keys(booleans).length > 0 || Object.keys(otherExtra).length > 0
      ? { ...otherExtra, ...booleans }
      : null;
    setSaving(true);
    await onSubmit({ name: name.trim(), extra });
    setSaving(false);
  };

  const handleToggleBoolean = (key: string) => {
    setBooleans((prev) => ({ ...prev, [key]: !prev[key] }));
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

        {Object.keys(booleans).length > 0 && (
          <div className="space-y-2 rounded-lg bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-700">Supports</p>
            {Object.entries(booleans).map(([key, value]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={value}
                  onChange={() => handleToggleBoolean(key)}
                />
                <span className="text-sm text-gray-700">{camelToTitle(key)}</span>
              </label>
            ))}
          </div>
        )}

        {Object.keys(otherExtra).length > 0 && (
          <Field label="Other properties (JSON)">
            <Textarea
              value={JSON.stringify(otherExtra, null, 2)}
              onChange={(val) => {
                try {
                  setOtherExtra(JSON.parse(val));
                } catch {
                  // Allow invalid JSON while typing
                }
              }}
              rows={4}
              className="font-mono text-xs"
            />
          </Field>
        )}
      </div>
    </Modal>
  );
}

function downloadTemplate(type: LookupType) {
  const spec = LOOKUP_IMPORT_COLUMNS[type];
  if (!spec) return;
  const quote = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  // BOM so Excel opens the file as UTF-8 (Arabic names etc.).
  const csv =
    "﻿" + [spec.columns, spec.example].map((r) => r.map(quote).join(",")).join("\r\n") + "\r\n";
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${type}-template.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ImportModal({
  open,
  type,
  onClose,
  onImported,
}: {
  open: boolean;
  type: LookupType;
  onClose: () => void;
  onImported: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<LookupImportResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFile(null);
      setPreview(null);
    }
  }, [open, type]);

  const spec = LOOKUP_IMPORT_COLUMNS[type];

  // Validate on the server (dry run) as soon as a file is picked, so the admin sees what will happen.
  const pick = async (f: File | null) => {
    setFile(f);
    setPreview(null);
    if (!f) return;
    setChecking(true);
    try {
      setPreview(await importLookups(type, f, true));
    } catch (e) {
      toast.error(errMessage(e, "Could not read the file."));
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } finally {
      setChecking(false);
    }
  };

  const confirm = async () => {
    if (!file) return;
    setSaving(true);
    try {
      const res = await importLookups(type, file, false);
      if (res.errors.length > 0) {
        setPreview(res);
        toast.error("Import failed. Fix the rows listed and try again.");
        return;
      }
      toast.success(
        `Imported ${res.created} item(s)` + (res.skipped ? `, skipped ${res.skipped}.` : "."),
      );
      onImported();
    } catch (e) {
      toast.error(errMessage(e, "Import failed."));
    } finally {
      setSaving(false);
    }
  };

  const ready = !!preview && preview.errors.length === 0 && preview.created > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Import ${type}`}
      wide
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={confirm} disabled={!ready || saving || checking}>
            {saving ? "Importing..." : ready ? `Import ${preview.created} item(s)` : "Import"}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <div className="rounded-xl bg-gray-50 p-4 text-gray-600">
          <p>
            Upload a <b>.csv</b> or <b>.xlsx</b> file. The first row must be a header with these
            columns (only <code className="font-mono">name</code> is required):
          </p>
          <p className="mt-2 font-mono text-xs text-gray-800">{spec?.columns.join(", ")}</p>
          {type === "breeds" && (
            <p className="mt-2 text-xs">
              Link each breed to a species with <code className="font-mono">speciesName</code>{" "}
              (e.g. Dog) or <code className="font-mono">speciesId</code>.
            </p>
          )}
          <p className="mt-2 text-xs">
            Names that already exist are skipped. If any row has an error, nothing is imported.
          </p>
          <button
            type="button"
            onClick={() => downloadTemplate(type)}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-paw-orange hover:underline"
          >
            <Download className="h-3.5 w-3.5" /> Download CSV template
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
        />

        {checking && <p className="text-gray-500">Checking file...</p>}

        {preview && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Tag>{preview.totalRows} row(s)</Tag>
              {preview.errors.length === 0 ? (
                <Tag tone="green">{preview.created} to create</Tag>
              ) : (
                <Tag tone="red">{preview.errors.length} error(s)</Tag>
              )}
              {preview.skipped > 0 && <Tag tone="amber">{preview.skipped} skipped</Tag>}
            </div>
            <IssueTable
              title="Errors (nothing will be imported until these are fixed)"
              issues={preview.errors}
              tone="red"
            />
            <IssueTable title="Skipped" issues={preview.skippedRows} tone="amber" />
          </div>
        )}
      </div>
    </Modal>
  );
}

function IssueTable({
  title,
  issues,
  tone,
}: {
  title: string;
  issues: LookupImportResult["errors"];
  tone: "red" | "amber";
}) {
  if (issues.length === 0) return null;
  return (
    <div>
      <p
        className={`mb-1 text-xs font-semibold ${tone === "red" ? "text-red-600" : "text-amber-700"}`}
      >
        {title}
      </p>
      <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-100">
        <Table>
          <THead>
            <TR>
              <TH className="w-20">Row</TH>
              <TH>Name</TH>
              <TH>Reason</TH>
            </TR>
          </THead>
          <TBody>
            {issues.map((i) => (
              <TR key={`${i.row}-${i.message}`}>
                <TD className="text-gray-400">{i.row}</TD>
                <TD>{i.name ?? "—"}</TD>
                <TD className="text-gray-600">{i.message}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
