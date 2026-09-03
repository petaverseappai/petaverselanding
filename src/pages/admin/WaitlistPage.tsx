import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getWaitlist } from "@/services/admin";
import type { WaitlistEntry } from "@/types/admin.types";

export default function WaitlistPage() {
  const [total, setTotal] = useState<number | null>(null);
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWaitlist()
      .then((data) => {
        setTotal(data.total);
        setEntries(data.entries);
      })
      .catch(() => toast.error("Failed to load waitlist."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Waitlist</h1>
          <p className="mt-1 text-sm text-gray-500">
            {loading ? "Loading..." : `${total ?? 0} total signup${total === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white shadow-sm overflow-hidden">
        {loading ? (
          <p className="px-6 py-10 text-sm text-gray-400">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="px-6 py-10 text-sm text-gray-400">No entries yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-400">{entry.id}</td>
                  <td className="px-6 py-3 text-gray-900">{entry.email}</td>
                  <td className="px-6 py-3 text-gray-500">
                    {new Date(entry.joinedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
