import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { getPosts, deletePost } from "@/services/admin";
import type { PostListItem } from "@/types/admin.types";
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
  ConfirmModal,
} from "@/components/admin/ui";
import { fmtDate, errMessage } from "@/lib/adminFormat";
import { useDebounced } from "@/lib/useDebounced";

const VISIBILITY_OPTS = [
  { value: "Public", label: "Public" },
  { value: "Community", label: "Community" },
  { value: "Private", label: "Private" },
];

export default function PostsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 350);
  const [visibility, setVisibility] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [authorPetId, setAuthorPetId] = useState("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<PostListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmPost, setConfirmPost] = useState<PostListItem | null>(null);

  const load = () => {
    setLoading(true);
    getPosts({
      search: debouncedSearch || undefined,
      visibility: visibility || undefined,
      communityId: communityId === "" ? undefined : Number(communityId),
      authorPetId: authorPetId === "" ? undefined : Number(authorPetId),
      page,
      pageSize: 20,
    })
      .then((res) => {
        setItems(res.items);
        setTotalPages(res.totalPages);
        setTotalCount(res.totalCount);
      })
      .catch((e) => toast.error(errMessage(e, "Failed to load posts.")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, visibility, communityId, authorPetId]);

  useEffect(load, [debouncedSearch, visibility, communityId, authorPetId, page]);

  const onDelete = async (p: PostListItem) => {
    setBusyId(p.id);
    try {
      await deletePost(p.id);
      toast.success("Post deleted.");
      load();
    } catch (e) {
      toast.error(errMessage(e, "Failed to delete."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Posts" subtitle="Browse and moderate posts." />

      <Panel>
        <div className="p-4">
          <FilterBar>
            <TextField
              value={search}
              onChange={setSearch}
              placeholder="Search caption..."
              className="w-56"
            />
            <SelectField
              value={visibility}
              onChange={setVisibility}
              options={VISIBILITY_OPTS}
              placeholder="Any visibility"
            />
            <TextField
              value={communityId}
              onChange={setCommunityId}
              placeholder="Community ID"
              type="number"
              className="w-36"
            />
            <TextField
              value={authorPetId}
              onChange={setAuthorPetId}
              placeholder="Author pet ID"
              type="number"
              className="w-36"
            />
          </FilterBar>
        </div>

        {loading ? (
          <EmptyState>Loading...</EmptyState>
        ) : items.length === 0 ? (
          <EmptyState>No posts match these filters.</EmptyState>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Author</TH>
                <TH>Caption</TH>
                <TH>Visibility</TH>
                <TH>Likes</TH>
                <TH>Comments</TH>
                <TH>Status</TH>
                <TH>Created</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {items.map((p) => (
                <TR key={p.id}>
                  <TD className="font-medium text-gray-900">
                    {p.authorPetName} <span className="text-gray-400">#{p.authorPetId}</span>
                  </TD>
                  <TD className="max-w-xs truncate">{p.caption ?? "—"}</TD>
                  <TD>
                    <Tag tone="blue">{p.visibility}</Tag>
                  </TD>
                  <TD>{p.likeCount}</TD>
                  <TD>{p.commentCount}</TD>
                  <TD>
                    {p.isDeleted ? <Tag tone="red">Deleted</Tag> : <Tag tone="green">Live</Tag>}
                  </TD>
                  <TD className="whitespace-nowrap text-gray-500">{fmtDate(p.createdAt)}</TD>
                  <TD>
                    {!p.isDeleted && (
                      <button
                        onClick={() => setConfirmPost(p)}
                        disabled={busyId === p.id}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
        <Pagination page={page} totalPages={totalPages} totalCount={totalCount} onChange={setPage} />
      </Panel>

      <ConfirmModal
        open={confirmPost !== null}
        onClose={() => setConfirmPost(null)}
        onConfirm={() => confirmPost && onDelete(confirmPost)}
        title="Delete post"
        message="Soft-delete this post? It will be hidden from the feed."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
