// Wraps the app in app-wide context. Kept as its own layer (rather than inlined
// into App.tsx) so the admin portal can slot in auth/query providers here later
// without touching the router or entry point.
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
