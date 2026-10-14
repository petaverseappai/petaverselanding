import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { getVisionProfiles, deleteVisionProfile } from "@/services/admin";
import type { VisionProfile } from "@/services/admin";
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
  EmptyState,
  LoadingState,
  Modal,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { errMessage } from "@/lib/adminFormat";
import { adminPaths } from "@/constants/routes";

export default function VisionProfilesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<VisionProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<VisionProfile | null>(null);

  const load = () => {
    setLoading(true);
    getVisionProfiles()
      .then(setItems)
      .catch((e) => toast.error(errMessage(e, "Failed to load vision profiles.")))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteVisionProfile(deleting.id);
      toast.success("Vision profile deleted.");
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(errMessage(e, "Failed to delete vision profile."));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vision Profiles"
        subtitle="Manage how pets perceive color based on their species."
        actions={
          <Button onClick={() => navigate(adminPaths.visionProfileDetail("new"))}>
            <Plus className="mr-2 h-4 w-4" />
            Add profile
          </Button>
        }
      />

      <Panel>
        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState>No vision profiles found.</EmptyState>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Species</TH>
                <TH>Version</TH>
                <TH>Brightness</TH>
                <TH>Contrast</TH>
                <TH>Saturation</TH>
                <TH>Status</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {items.map((p) => (
                <TR key={p.id}>
                  <TD className="font-medium text-gray-900">{p.speciesName}</TD>
                  <TD className="text-sm text-gray-600">v{p.version}</TD>
                  <TD className="text-sm text-gray-600">{p.brightness.toFixed(2)}</TD>
                  <TD className="text-sm text-gray-600">{p.contrast.toFixed(2)}</TD>
                  <TD className="text-sm text-gray-600">{p.saturation.toFixed(2)}</TD>
                  <TD>
                    <Tag tone={p.isActive ? "green" : "gray"}>
                      {p.isActive ? "Active" : "Inactive"}
                    </Tag>
                  </TD>
                  <TD>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(adminPaths.visionProfileDetail(p.id))}
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
      </Panel>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={`Delete "${deleting?.speciesName ?? ""}" v${deleting?.version ?? ""}`}
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
          This action cannot be undone. Are you sure you want to delete this vision profile?
        </p>
      </Modal>
    </div>
  );
}
