import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  getServiceProviders,
  deleteServiceProvider,
  getCategories,
} from "@/services/admin";
import type { ServiceProviderListItem, Category } from "@/services/admin";
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
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { fmtDate, errMessage } from "@/lib/adminFormat";
import { useDebounced } from "@/lib/useDebounced";
import { adminPaths } from "@/constants/routes";

export default function ServiceProvidersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 350);
  const [categoryId, setCategoryId] = useState("");
  const [verified, setVerified] = useState("");
  const [isVet, setIsVet] = useState("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<ServiceProviderListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [deleting, setDeleting] = useState<ServiceProviderListItem | null>(null);

  const load = () => {
    setLoading(true);
    getServiceProviders({
      search: debouncedSearch || undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      verified: verified === "" ? undefined : verified === "true",
      isVet: isVet === "" ? undefined : isVet === "true",
      page,
      pageSize: 20,
    })
      .then((res) => {
        setItems(res.items);
        setTotalPages(res.totalPages);
        setTotalCount(res.totalCount);
      })
      .catch((e) => toast.error(errMessage(e, "Failed to load providers.")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((e) => toast.error(errMessage(e, "Failed to load categories.")));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryId, verified, isVet]);

  useEffect(load, [debouncedSearch, categoryId, verified, isVet, page]);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteServiceProvider(deleting.id);
      toast.success("Provider deleted.");
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(errMessage(e, "Failed to delete provider."));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Providers"
        subtitle="Manage veterinarians, groomers, trainers, and other service providers."
        actions={
          <Button onClick={() => navigate(adminPaths.serviceProviderDetail("new"))}>
            <Plus className="mr-2 h-4 w-4" />
            Add provider
          </Button>
        }
      />

      <Panel>
        <div className="p-4">
          <FilterBar>
            <TextField
              value={search}
              onChange={setSearch}
              placeholder="Search..."
              className="w-64"
            />
            <SelectField
              value={categoryId}
              onChange={setCategoryId}
              options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
              placeholder="Any category"
            />
            <SelectField
              value={verified}
              onChange={setVerified}
              options={[
                { value: "true", label: "Verified" },
                { value: "false", label: "Unverified" },
              ]}
              placeholder="Any status"
            />
            <SelectField
              value={isVet}
              onChange={setIsVet}
              options={[
                { value: "true", label: "Vets" },
                { value: "false", label: "Other" },
              ]}
              placeholder="Any type"
            />
          </FilterBar>
        </div>

        {loading ? (
          <EmptyState>Loading...</EmptyState>
        ) : items.length === 0 ? (
          <EmptyState>No providers match these filters.</EmptyState>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Category</TH>
                <TH>Type</TH>
                <TH>Verified</TH>
                <TH>Rating</TH>
                <TH>Branches</TH>
                <TH>Created</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {items.map((p) => (
                <TR key={p.id}>
                  <TD className="font-medium text-gray-900">{p.name}</TD>
                  <TD className="text-sm text-gray-600">ID {p.primaryCategoryId}</TD>
                  <TD>
                    <Tag tone={p.isVet ? "blue" : "gray"}>{p.isVet ? "Vet" : "Service"}</Tag>
                  </TD>
                  <TD>
                    <Tag tone={p.isVerified ? "green" : "amber"}>
                      {p.isVerified ? "Verified" : "Unverified"}
                    </Tag>
                  </TD>
                  <TD>{p.rating ? `${p.rating.toFixed(1)} (${p.reviewCount})` : "—"}</TD>
                  <TD className="text-sm text-gray-600">{p.branchCount}</TD>
                  <TD className="whitespace-nowrap text-gray-500">{fmtDate(p.createdAt)}</TD>
                  <TD>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(adminPaths.serviceProviderDetail(p.id))}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleting(p)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
        <Pagination page={page} totalPages={totalPages} totalCount={totalCount} onChange={setPage} />
      </Panel>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={`Delete "${deleting?.name || ""}"`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          This action cannot be undone. Are you sure you want to delete this provider?
        </p>
      </Modal>
    </div>
  );
}
