import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getUsers } from "@/services/admin";
import type { UserListItem } from "@/types/admin.types";
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
} from "@/components/admin/ui";
import { adminPaths } from "@/constants/routes";
import { fmtDate, userStatusTone, errMessage } from "@/lib/adminFormat";
import { useDebounced } from "@/lib/useDebounced";

const ROLE_OPTS = [
  { value: "User", label: "User" },
  { value: "Vet", label: "Vet" },
  { value: "ServiceProvider", label: "Service Provider" },
  { value: "Admin", label: "Admin" },
];
const STATUS_OPTS = [
  { value: "Active", label: "Active" },
  { value: "Suspended", label: "Suspended" },
  { value: "Banned", label: "Banned" },
];
const VERIFIED_OPTS = [
  { value: "true", label: "Phone verified" },
  { value: "false", label: "Phone unverified" },
];

export default function UsersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 350);
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [verified, setVerified] = useState("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<UserListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, role, status, verified]);

  useEffect(() => {
    setLoading(true);
    getUsers({
      search: debouncedSearch || undefined,
      role: role || undefined,
      status: status || undefined,
      verified: verified === "" ? undefined : verified === "true",
      page,
      pageSize: 20,
    })
      .then((res) => {
        setItems(res.items);
        setTotalPages(res.totalPages);
        setTotalCount(res.totalCount);
      })
      .catch((e) => toast.error(errMessage(e, "Failed to load users.")))
      .finally(() => setLoading(false));
  }, [debouncedSearch, role, status, verified, page]);

  return (
    <div className="space-y-6">
      <PageHeader title="Users" subtitle="Search and manage registered users." />

      <Panel>
        <div className="p-4">
          <FilterBar>
            <TextField
              value={search}
              onChange={setSearch}
              placeholder="Search name, code, phone, email..."
              className="w-72"
            />
            <SelectField value={role} onChange={setRole} options={ROLE_OPTS} placeholder="Any role" />
            <SelectField
              value={status}
              onChange={setStatus}
              options={STATUS_OPTS}
              placeholder="Any status"
            />
            <SelectField
              value={verified}
              onChange={setVerified}
              options={VERIFIED_OPTS}
              placeholder="Any verification"
            />
          </FilterBar>
        </div>

        {loading ? (
          <EmptyState>Loading...</EmptyState>
        ) : items.length === 0 ? (
          <EmptyState>No users match these filters.</EmptyState>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>User</TH>
                <TH>Contact</TH>
                <TH>Roles</TH>
                <TH>Pets</TH>
                <TH>Status</TH>
                <TH>Joined</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((u) => (
                <TR key={u.id} onClick={() => navigate(adminPaths.userDetail(u.id))}>
                  <TD>
                    <p className="font-medium text-gray-900">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-xs text-gray-400">{u.userCode}</p>
                  </TD>
                  <TD>
                    <p className="text-gray-700">{u.email}</p>
                    <p className="text-xs text-gray-400">{u.mobileNumber}</p>
                  </TD>
                  <TD>
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <Tag key={r} tone="blue">
                          {r}
                        </Tag>
                      ))}
                    </div>
                  </TD>
                  <TD>{u.petCount}</TD>
                  <TD>
                    <Tag tone={userStatusTone(u.status)}>{u.status}</Tag>
                  </TD>
                  <TD className="whitespace-nowrap text-gray-500">{fmtDate(u.createdAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
        <Pagination page={page} totalPages={totalPages} totalCount={totalCount} onChange={setPage} />
      </Panel>
    </div>
  );
}
