import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getCommunities } from "@/services/admin";
import type { CommunityListItem } from "@/types/admin.types";
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
  SelectField,
} from "@/components/admin/ui";
import { adminPaths } from "@/constants/routes";
import { fmtDate, fmtNumber, errMessage } from "@/lib/adminFormat";
import { useDebounced } from "@/lib/useDebounced";

const IS_SYSTEM_OPTS = [
  { value: "true", label: "Species (system)" },
  { value: "false", label: "User-created" },
];

const IS_DELETED_OPTS = [
  { value: "false", label: "Active" },
  { value: "true", label: "Deleted" },
];

export default function CommunitiesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 350);
  const [isSystem, setIsSystem] = useState("");
  const [isDeleted, setIsDeleted] = useState("false");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<CommunityListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, isSystem, isDeleted]);

  useEffect(() => {
    setLoading(true);
    getCommunities({
      search: debouncedSearch || undefined,
      isSystem: isSystem === "" ? undefined : isSystem === "true",
      isDeleted: isDeleted === "" ? undefined : isDeleted === "true",
      page,
      pageSize: 20,
    })
      .then((res) => {
        setItems(res.items);
        setTotalPages(res.totalPages);
        setTotalCount(res.totalCount);
      })
      .catch((e) => toast.error(errMessage(e, "Failed to load communities.")))
      .finally(() => setLoading(false));
  }, [debouncedSearch, isSystem, isDeleted, page]);

  return (
    <div className="space-y-6">
      <PageHeader title="Communities" subtitle="Manage community groups." />

      <Panel>
        <div className="p-4">
          <FilterBar>
            <TextField
              value={search}
              onChange={setSearch}
              placeholder="Search name or handle..."
              className="w-64"
            />
            <SelectField
              value={isSystem}
              onChange={setIsSystem}
              options={IS_SYSTEM_OPTS}
              placeholder="All types"
            />
            <SelectField
              value={isDeleted}
              onChange={setIsDeleted}
              options={IS_DELETED_OPTS}
              placeholder="All statuses"
            />
          </FilterBar>
        </div>

        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState>No communities match these filters.</EmptyState>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Category</TH>
                <TH>Species</TH>
                <TH>Lead pet</TH>
                <TH>Members</TH>
                <TH>Posts</TH>
                <TH>Status</TH>
                <TH>Created</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((c) => (
                <TR key={c.id} onClick={() => navigate(adminPaths.communityDetail(c.id))}>
                  <TD>
                    <div className="flex items-center gap-2">
                      {c.avatarUrl && (
                        <img
                          src={c.avatarUrl}
                          alt=""
                          className="h-7 w-7 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{c.name}</p>
                        {c.handle && (
                          <p className="text-xs text-gray-400">@{c.handle}</p>
                        )}
                      </div>
                    </div>
                  </TD>
                  <TD>
                    <Tag tone={c.isSystem ? "orange" : "blue"}>{c.category}</Tag>
                  </TD>
                  <TD className="text-gray-500">{c.speciesName ?? "—"}</TD>
                  <TD className="text-gray-700">{c.leadPetName ?? "—"}</TD>
                  <TD>{fmtNumber(c.memberCount)}</TD>
                  <TD>{fmtNumber(c.postCount)}</TD>
                  <TD>
                    {c.isDeleted ? (
                      <Tag tone="red">Deleted</Tag>
                    ) : (
                      <Tag tone="green">Active</Tag>
                    )}
                  </TD>
                  <TD className="whitespace-nowrap text-gray-500">{fmtDate(c.createdAt)}</TD>
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
