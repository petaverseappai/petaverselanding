import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getAppConfig, updateAppConfig } from "@/services/admin";
import type { AppConfig } from "@/types/admin.types";
import { PageHeader, Panel, Field, TextField, Textarea } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative mt-1 inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-paw-orange focus:ring-offset-2 ${
        value ? "bg-paw-orange" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          value ? "translate-x-6" : "translate-x-1"
        }`}
      />
      <span className="sr-only">{value ? "On" : "Off"}</span>
    </button>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="border-b px-6 py-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-4">
      <Field label={label}>{children}</Field>
    </div>
  );
}

export default function AppConfigPage() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [draft, setDraft] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAppConfig()
      .then((data) => {
        setConfig(data);
        setDraft(data);
      })
      .catch(() => toast.error("Failed to load app config."))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !draft || !config) {
    return (
      <div className="space-y-6">
        <PageHeader title="App Config" subtitle="Manage runtime configuration for the mobile app." />
        <Panel>
          <p className="px-6 py-14 text-center text-sm text-gray-400">Loading...</p>
        </Panel>
      </div>
    );
  }

  const isDirty = JSON.stringify(draft) !== JSON.stringify(config);

  const set = <K extends keyof AppConfig>(key: K, value: AppConfig[K]) =>
    setDraft((d) => d ? { ...d, [key]: value } : d);

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const updated = await updateAppConfig(draft);
      setConfig(updated);
      setDraft(updated);
      toast.success("Config saved.");
    } catch {
      toast.error("Failed to save config.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="App Config"
        subtitle="Manage runtime configuration for the mobile app."
        actions={
          <Button onClick={handleSave} disabled={saving || !isDirty}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        }
      />

      <Panel>
        <SectionHeader title="General" />
        <div className="divide-y divide-gray-50">
          <Row label="Support email">
            <TextField
              value={draft.supportEmail}
              onChange={(v) => set("supportEmail", v)}
              className="mt-1 w-full max-w-md"
            />
          </Row>
          <Row label="Adoption contact email">
            <TextField
              value={draft.adoptionContactEmail}
              onChange={(v) => set("adoptionContactEmail", v)}
              className="mt-1 w-full max-w-md"
            />
          </Row>
          <Row label="Min app version">
            <TextField
              value={draft.minAppVersion}
              onChange={(v) => set("minAppVersion", v)}
              className="mt-1 w-40"
            />
          </Row>
          <Row label="Latest app version">
            <TextField
              value={draft.latestAppVersion}
              onChange={(v) => set("latestAppVersion", v)}
              className="mt-1 w-40"
            />
          </Row>
        </div>
      </Panel>

      <Panel>
        <SectionHeader title="Feature flags" />
        <div className="divide-y divide-gray-50">
          <Row label="Adoption">
            <Toggle
              value={draft.features.adoption}
              onChange={(v) => set("features", { ...draft.features, adoption: v })}
            />
          </Row>
          <Row label="AI Chat">
            <Toggle
              value={draft.features.aiChat}
              onChange={(v) => set("features", { ...draft.features, aiChat: v })}
            />
          </Row>
          <Row label="Lost & Found">
            <Toggle
              value={draft.features.lostFound}
              onChange={(v) => set("features", { ...draft.features, lostFound: v })}
            />
          </Row>
        </div>
      </Panel>

      <Panel>
        <SectionHeader title="Maintenance" />
        <div className="divide-y divide-gray-50">
          <Row label="Maintenance mode">
            <Toggle
              value={draft.maintenance.active}
              onChange={(v) => set("maintenance", { ...draft.maintenance, active: v })}
            />
          </Row>
          <Row label="Message">
            <Textarea
              value={draft.maintenance.message}
              onChange={(v) => set("maintenance", { ...draft.maintenance, message: v })}
              rows={3}
              className="mt-1"
            />
          </Row>
          <Row label="Ends at (UTC)">
            <input
              type="datetime-local"
              value={draft.maintenance.endsAt ? new Date(draft.maintenance.endsAt).toISOString().slice(0, 16) : ""}
              onChange={(e) =>
                set("maintenance", {
                  ...draft.maintenance,
                  endsAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                })
              }
              className="mt-1 h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-paw-orange focus:outline-none focus:ring-1 focus:ring-paw-orange"
            />
          </Row>
        </div>
      </Panel>

      <Panel>
        <SectionHeader title="Links" />
        <div className="divide-y divide-gray-50">
          {(
            [
              ["Terms URL", "terms"],
              ["Privacy URL", "privacy"],
              ["Help URL", "help"],
              ["App Store URL", "appStore"],
              ["Play Store URL", "playStore"],
            ] as [string, keyof AppConfig["links"]][]
          ).map(([label, key]) => (
            <Row key={key} label={label}>
              <TextField
                value={draft.links[key]}
                onChange={(v) => set("links", { ...draft.links, [key]: v })}
                className="mt-1 w-full max-w-md"
              />
            </Row>
          ))}
        </div>
      </Panel>

      <Panel>
        <SectionHeader title="Map defaults" />
        <div className="divide-y divide-gray-50">
          <Row label="Default latitude">
            <TextField
              type="number"
              value={String(draft.map.defaultLat)}
              onChange={(v) => set("map", { ...draft.map, defaultLat: Number(v) })}
              className="mt-1 w-40"
            />
          </Row>
          <Row label="Default longitude">
            <TextField
              type="number"
              value={String(draft.map.defaultLng)}
              onChange={(v) => set("map", { ...draft.map, defaultLng: Number(v) })}
              className="mt-1 w-40"
            />
          </Row>
          <Row label="Default radius (km)">
            <TextField
              type="number"
              value={String(draft.map.defaultRadiusKm)}
              onChange={(v) => set("map", { ...draft.map, defaultRadiusKm: Number(v) })}
              className="mt-1 w-32"
            />
          </Row>
        </div>
      </Panel>
    </div>
  );
}
