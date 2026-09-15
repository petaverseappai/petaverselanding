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
  FilterBar,
  TextField,
  SelectField,
} from "@/components/admin/ui";
import { adminPaths } from "@/constants/routes";
import { fmtDate, errMessage } from "@/lib/adminFormat";
import { useDebounced } from "@/lib/useDebounced";

const CATEGORY_OPTS = [
  "BreedClub",
  "ShelterAndRescues",
  "Breeding",
  "SpecialNeeds",
  "Activity",
  "Health",
  "Other",
].map((c) => ({ value: c, label: c }));

export default function CommunitiesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 350);
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<CommunityListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category]);

  useEffect(() => {
    setLoading(true);
    getCommunities({
      search: debouncedSearch || undefined,
      category: category || undefined,
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
  }, [debouncedSearch, category, page]);

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
              value={category}
              onChange={setCategory}
              options={CATEGORY_OPTS}
              placeholder="Any category"
            />
          </FilterBar>
        </div>

        {loading ? (
          <EmptyState>Loading...</EmptyState>
        ) : items.length === 0 ? (
          <EmptyState>No communities match these filters.</EmptyState>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Category</TH>
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
                    <p className="font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-400">@{c.handle}</p>
                  </TD>
                  <TD>
                    <Tag tone="blue">{c.category}</Tag>
                  </TD>
                  <TD>{c.leadPetName}</TD>
                  <TD>{c.memberCount}</TD>
                  <TD>{c.postCount}</TD>
                  <TD>
                    {c.isDeleted ? <Tag tone="red">Archived</Tag> : <Tag tone="green">Active</Tag>}
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
