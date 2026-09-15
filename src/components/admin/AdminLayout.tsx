import * as React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";

class PageErrorBoundary extends React.Component<
  { children: React.ReactNode; resetKey: string },
  { error: Error | null; lastResetKey: string }
> {
  constructor(props: { children: React.ReactNode; resetKey: string }) {
    super(props);
    this.state = { error: null, lastResetKey: props.resetKey };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  static getDerivedStateFromProps(
    props: { resetKey: string },
    state: { error: Error | null; lastResetKey: string },
  ) {
    if (props.resetKey !== state.lastResetKey) {
      return { error: null, lastResetKey: props.resetKey };
    }
    return null;
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-lg font-semibold text-gray-800">Something went wrong</p>
          <p className="mt-2 max-w-md text-sm text-gray-500">
            {this.state.error.message}
          </p>
          <button
            className="mt-6 rounded-lg bg-paw-orange px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function AdminLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <PageErrorBoundary resetKey={location.pathname}>
          <Outlet />
        </PageErrorBoundary>
      </main>
    </div>
  );
}
