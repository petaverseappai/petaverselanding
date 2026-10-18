import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getPageFeed, deletePost } from "@/services/portal";
import { usePageId } from "@/context/PortalPageContext";
import { ROUTES } from "@/constants/routes";
import {
  PageHeader, Panel, Table, THead, TH, TBody, TR, TD,
  Tag, LoadingState, EmptyState, ConfirmModal,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { fmtDate } from "@/lib/adminFormat";
import type { PostFeedResult, PostListItem } from "@/types/portal.types";

export default function PortalPostsPage() {
  const pageId = usePageId();
  const navigate = useNavigate();
  const [result, setResult] = useState<PostFeedResult | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<PostListItem | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = (p: number) => {
    setLoading(true);
    getPageFeed(pageId, { page: p, limit: 20 })
      .then((r) => { setResult(r); setCurrentPage(p); })
      .catch(() => toast.error("Failed to load posts."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(0); }, [pageId]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    try {
      await deletePost(pageId, pendingDelete.id);
      toast.success("Post deleted.");
      load(currentPage);
    } catch {
      toast.error("Failed to delete post.");
    } finally {
      setBusyId(null);
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Posts"
        subtitle="Manage your page's posts."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.PORTAL_POSTS_NEW_WITH_LISTING)}>
              New post + listing
            </Button>
            <Button size="sm" onClick={() => navigate(ROUTES.PORTAL_POSTS_NEW)}>
              New post
            </Button>
          </div>
        }
      />

      <Panel>
        {loading ? (
          <LoadingState />
        ) : result?.posts.length === 0 ? (
          <EmptyState>No posts yet. Create your first post above.</EmptyState>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Post</TH>
                <TH>Likes</TH>
                <TH>Comments</TH>
                <TH>Listing</TH>
                <TH>Date</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {result?.posts.map((post) => (
                <TR key={post.id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      {post.thumbnailUrl ? (
                        <img
                          src={post.thumbnailUrl}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-100" />
                      )}
                      <span className="max-w-xs truncate text-sm font-medium text-gray-900">
                        {post.caption ?? "—"}
                      </span>
                    </div>
                  </TD>
                  <TD>{post.likes}</TD>
                  <TD>{post.comments}</TD>
                  <TD>
                    {post.adoptionListing ? (
                      <Tag tone="blue">{post.adoptionListing.petName}</Tag>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TD>
                  <TD className="whitespace-nowrap text-gray-500">{fmtDate(post.createdAt)}</TD>
                  <TD>
                    <button
                      onClick={() => setPendingDelete(post)}
                      disabled={busyId === post.id}
                      className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}

        {result && (result.hasMore || currentPage > 0) && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3 text-xs text-gray-500">
            <span>{result.postCount} total</span>
            <div className="flex gap-1">
              <button
                disabled={currentPage === 0}
                onClick={() => load(currentPage - 1)}
                className="inline-flex h-8 items-center gap-1 rounded-lg px-2 font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={result.nextPage === null}
                onClick={() => load(currentPage + 1)}
                className="inline-flex h-8 items-center gap-1 rounded-lg px-2 font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Panel>

      <ConfirmModal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Delete post"
        message="This post will be permanently deleted and removed from your page."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
