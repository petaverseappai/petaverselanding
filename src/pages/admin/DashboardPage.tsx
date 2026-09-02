import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getWaitlist } from "@/services/admin";
import type { WaitlistEntry } from "@/types/admin.types";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { logout } = useAuth();
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
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <h1 className="text-lg font-bold text-gray-900">PetaVerse Admin</h1>
        <Button variant="outline" size="sm" onClick={logout}>
          Sign out
        </Button>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total signups</p>
          <p className="mt-1 text-4xl font-bold text-gray-900">
            {loading ? "..." : (total ?? 0)}
          </p>
        </div>

        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <div className="border-b px-6 py-4">
            <h2 className="font-semibold text-gray-900">Waitlist entries</h2>
          </div>

          {loading ? (
            <p className="px-6 py-8 text-sm text-gray-400">Loading...</p>
          ) : entries.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-400">No entries yet.</p>
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
      </main>
    </div>
  );
}
