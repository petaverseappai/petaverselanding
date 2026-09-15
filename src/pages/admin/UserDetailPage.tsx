import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ShieldCheck, LogOut, Phone } from "lucide-react";
import {
  getUser,
  getUserPets,
  updateUserRoles,
  suspendUser,
  banUser,
  reinstateUser,
  forceVerifyPhone,
  revokeUserSessions,
} from "@/services/admin";
import type { UserDetail, UserPet, UserRole } from "@/types/admin.types";
import {
  PageHeader,
  Panel,
  Tag,
  Modal,
  Field,
  TextField,
  Textarea,
  EmptyState,
  Table,
  THead,
  TBody,
  TH,
  TR,
  TD,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { fmtDate, fmtDateTime, userStatusTone, errMessage } from "@/lib/adminFormat";

const ALL_ROLES: UserRole[] = ["User", "Vet", "ServiceProvider", "Admin"];

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [pets, setPets] = useState<UserPet[]>([]);
  const [loading, setLoading] = useState(true);

  const [rolesOpen, setRolesOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [banOpen, setBanOpen] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([getUser(id), getUserPets(id, { pageSize: 100 })])
      .then(([u, p]) => {
        setUser(u);
        setPets(p.items);
      })
      .catch((e) => toast.error(errMessage(e, "Failed to load user.")))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const runAction = async (fn: () => Promise<unknown>, success: string) => {
    try {
      await fn();
      toast.success(success);
      load();
    } catch (e) {
      toast.error(errMessage(e, "Action failed."));
    }
  };

  if (loading) return <p className="text-sm text-gray-400">Loading...</p>;
  if (!user) return <p className="text-sm text-gray-400">User not found.</p>;

  return (
    <div className="space-y-6">
      <Link
        to={ROUTES.ADMIN_USERS}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to users
      </Link>

      <PageHeader
        title={`${user.firstName} ${user.lastName}`}
        subtitle={
          <span className="flex items-center gap-2">
            <Tag tone={userStatusTone(user.status)}>{user.status}</Tag>
            <span>{user.userCode}</span>
            {user.suspendedUntil && (
              <span className="text-amber-600">
                until {fmtDate(user.suspendedUntil)}
              </span>
            )}
          </span>
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setRolesOpen(true)}>
              Edit roles
            </Button>
            {user.status === "Active" ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setSuspendOpen(true)}>
                  Suspend
                </Button>
                <Button variant="outline" size="sm" onClick={() => setBanOpen(true)}>
                  Ban
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() =>
                  runAction(() => reinstateUser(user.id), "User reinstated.")
                }
              >
                Reinstate
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel className="p-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Profile</h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <Info label="Email">
                {user.email}{" "}
                {user.emailConfirmed ? (
                  <Tag tone="green">confirmed</Tag>
                ) : (
                  <Tag tone="amber">unconfirmed</Tag>
                )}
              </Info>
              <Info label="Phone">
                {user.mobileNumber}{" "}
                {user.phoneConfirmed ? (
                  <Tag tone="green">confirmed</Tag>
                ) : (
                  <Tag tone="amber">unconfirmed</Tag>
                )}
              </Info>
              {user.pendingEmail && <Info label="Pending email">{user.pendingEmail}</Info>}
              <Info label="Date of birth">{fmtDate(user.dateOfBirth)}</Info>
              <Info label="Location">{user.locationName ?? "—"}</Info>
              <Info label="Roles">
                <div className="flex flex-wrap gap-1">
                  {user.roles.map((r) => (
                    <Tag key={r} tone="blue">
                      {r}
                    </Tag>
                  ))}
                </div>
              </Info>
              <Info label="Joined">{fmtDateTime(user.createdAt)}</Info>
            </dl>
          </Panel>

          <Panel>
            <h3 className="px-6 pt-6 text-sm font-semibold text-gray-900">
              Pets ({pets.length})
            </h3>
            {pets.length === 0 ? (
              <EmptyState>No pets.</EmptyState>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Name</TH>
                    <TH>Species</TH>
                    <TH>Breed</TH>
                    <TH>Ownership</TH>
                  </TR>
                </THead>
                <TBody>
                  {pets.map((p) => (
                    <TR key={p.id}>
                      <TD className="font-medium text-gray-900">{p.name}</TD>
                      <TD>{p.species ?? "—"}</TD>
                      <TD>{p.breed ?? "—"}</TD>
                      <TD>
                        {p.isPrimaryOwner ? (
                          <Tag tone="green">Primary</Tag>
                        ) : (
                          <Tag tone="gray">Co-owner</Tag>
                        )}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel className="p-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Activity</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Count label="Pets" value={user.counts.pets} />
              <Count label="Posts" value={user.counts.posts} />
              <Count label="Communities" value={user.counts.communities} />
              <Count label="Reports filed" value={user.counts.reportsFiled} />
              <Count label="Reports against" value={user.counts.reportsAgainst} />
              <Count label="Adoption listings" value={user.counts.adoptionListings} />
              <Count label="Lost & Found" value={user.counts.lostFoundReports} />
            </div>
          </Panel>

          <Panel className="p-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Support tools</h3>
            <div className="space-y-2">
              {!user.phoneConfirmed && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() =>
                    runAction(
                      () => forceVerifyPhone(user.id),
                      "Phone marked verified.",
                    )
                  }
                >
                  <Phone className="h-4 w-4" /> Force-verify phone
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() =>
                  runAction(
                    () => revokeUserSessions(user.id),
                    "Sessions revoked (forced logout).",
                  )
                }
              >
                <LogOut className="h-4 w-4" /> Revoke all sessions
              </Button>
            </div>
          </Panel>
        </div>
      </div>

      <RolesModal
        open={rolesOpen}
        onClose={() => setRolesOpen(false)}
        current={user.roles}
        onSave={async (roles) => {
          await runAction(() => updateUserRoles(user.id, roles), "Roles updated.");
          setRolesOpen(false);
        }}
      />

      <SuspendModal
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        onSubmit={async (days, reason) => {
          await runAction(
            () => suspendUser(user.id, { days, reason }),
            `Suspended ${days} day(s).`,
          );
          setSuspendOpen(false);
        }}
      />

      <BanModal
        open={banOpen}
        onClose={() => setBanOpen(false)}
        onSubmit={async (reason) => {
          await runAction(() => banUser(user.id, { reason }), "User banned.");
          setBanOpen(false);
        }}
      />
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-400">{label}</dt>
      <dd className="mt-0.5 flex flex-wrap items-center gap-1 text-gray-800">{children}</dd>
    </div>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

function RolesModal({
  open,
  onClose,
  current,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  current: string[];
  onSave: (roles: string[]) => Promise<void>;
}) {
  const [selected, setSelected] = useState<string[]>(current);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setSelected(current);
  }, [open, current]);

  const toggle = (role: string) =>
    setSelected((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit roles"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={saving || selected.length === 0}
            onClick={async () => {
              setSaving(true);
              await onSave(selected);
              setSaving(false);
            }}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        {ALL_ROLES.map((role) => (
          <label
            key={role}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <input
              type="checkbox"
              checked={selected.includes(role)}
              onChange={() => toggle(role)}
              className="h-4 w-4 accent-paw-orange"
            />
            <ShieldCheck className="h-4 w-4 text-gray-400" />
            {role}
          </label>
        ))}
        {selected.length === 0 && (
          <p className="text-xs text-red-500">Select at least one role.</p>
        )}
      </div>
    </Modal>
  );
}

function SuspendModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (days: number, reason: string) => Promise<void>;
}) {
  const [days, setDays] = useState("7");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Suspend user"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={saving}
            onClick={async () => {
              const d = Number(days);
              if (!d || d < 1) {
                toast.error("Days must be at least 1.");
                return;
              }
              setSaving(true);
              await onSubmit(d, reason);
              setSaving(false);
            }}
          >
            {saving ? "Suspending..." : "Suspend"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Days">
          <TextField type="number" value={days} onChange={setDays} className="w-full" />
        </Field>
        <Field label="Reason">
          <Textarea value={reason} onChange={setReason} placeholder="Reason for suspension" />
        </Field>
      </div>
    </Modal>
  );
}

function BanModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ban user"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              await onSubmit(reason);
              setSaving(false);
            }}
          >
            {saving ? "Banning..." : "Ban indefinitely"}
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-gray-500">
        Bans are indefinite and revoke the user's active sessions immediately.
      </p>
      <Field label="Reason">
        <Textarea value={reason} onChange={setReason} placeholder="Reason for ban" />
      </Field>
    </Modal>
  );
}
