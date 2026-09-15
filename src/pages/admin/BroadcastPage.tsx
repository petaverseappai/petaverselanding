import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { sendBroadcast } from "@/services/admin";
import type { BroadcastChannel, UserRole } from "@/types/admin.types";
import { PageHeader, Panel, Field, TextField, Textarea, ConfirmModal } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { errMessage } from "@/lib/adminFormat";

const CHANNELS: { value: BroadcastChannel; label: string }[] = [
  { value: "push", label: "Push" },
  { value: "email", label: "Email" },
  { value: "both", label: "Both" },
];
const ROLES: UserRole[] = ["User", "Vet", "ServiceProvider", "Admin"];

export default function BroadcastPage() {
  const [channel, setChannel] = useState<BroadcastChannel>("push");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [region, setRegion] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const toggleRole = (r: string) =>
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const submit = () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and body are required.");
      return;
    }
    setConfirmOpen(true);
  };

  const doSend = async () => {
    setSending(true);
    try {
      const res = await sendBroadcast({
        channel,
        title: title.trim(),
        body: body.trim(),
        segment: {
          roles: roles.length ? roles : null,
          region: region.trim() || null,
        },
      });
      toast.success(`Queued for ${res.queuedRecipients.toLocaleString()} recipient(s).`);
      setTitle("");
      setBody("");
      setRoles([]);
      setRegion("");
    } catch (e) {
      toast.error(errMessage(e, "Failed to send broadcast."));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Broadcast"
        subtitle="Send a push and/or email announcement to a segment."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel className="space-y-4 p-6 lg:col-span-2">
          <Field label="Channel">
            <div className="flex gap-2">
              {CHANNELS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setChannel(c.value)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    channel === c.value
                      ? "bg-paw-orange text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Title">
            <TextField value={title} onChange={setTitle} className="w-full" />
          </Field>

          <Field label="Body">
            <Textarea value={body} onChange={setBody} rows={6} />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Target roles (none = all)">
              <div className="flex flex-wrap gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    onClick={() => toggleRole(r)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      roles.includes(r)
                        ? "bg-paw-orange/10 text-paw-orange"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Region (substring, empty = all)">
              <TextField value={region} onChange={setRegion} className="w-full" placeholder="e.g. Beirut" />
            </Field>
          </div>

          <div className="pt-2">
            <Button onClick={submit} disabled={sending}>
              <Send className="h-4 w-4" />
              {sending ? "Sending..." : "Send broadcast"}
            </Button>
          </div>
        </Panel>

        <Panel className="p-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Preview</h3>
          <div className="rounded-xl border border-gray-200 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              {channel === "both" ? "Push + Email" : channel}
            </p>
            <p className="mt-2 font-semibold text-gray-900">{title || "Title"}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
              {body || "Message body..."}
            </p>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            Recipients: {roles.length ? roles.join(", ") : "All roles"}
            {region.trim() ? ` in ${region.trim()}` : ""}.
          </p>
          <p className="mt-2 text-xs text-amber-600">
            Email fan-out is synchronous. Keep large segments in mind.
          </p>
        </Panel>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doSend}
        title="Send broadcast"
        message="This will be delivered to all matching recipients. Are you sure?"
        confirmLabel="Send"
      />
    </div>
  );
}
