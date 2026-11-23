import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  FileText,
  LogOut,
  HomeIcon,
  MapPin,
} from "lucide-react";
import { usePortalAuth } from "@/context/PortalAuthContext";
import { ROUTES } from "@/constants/routes";

type NavItem = { label: string; icon: React.ElementType; to: string; end?: boolean };
type NavGroup = { heading: string; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    heading: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, to: ROUTES.PORTAL_DASHBOARD, end: true },
    ],
  },
  {
    heading: "Content",
    items: [
      { label: "Posts", icon: FileText, to: ROUTES.PORTAL_POSTS },
      { label: "Adoptions", icon: HomeIcon, to: ROUTES.PORTAL_LISTINGS },
    ],
  },
  {
    heading: "Account",
    items: [
      { label: "Branches", icon: MapPin, to: ROUTES.PORTAL_BRANCHES },
      { label: "Page Settings", icon: Settings, to: ROUTES.PORTAL_SETTINGS },
    ],
  },
];

export function PortalSidebar() {
  const { logout } = usePortalAuth();

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r bg-white">
      <div className="flex items-center gap-2 border-b px-5 py-5">
        <img src="/assets/brand/logo.png" alt="" className="h-8 w-auto" />
        <span className="text-base font-bold text-gray-900">PetaVerse</span>
        <span className="rounded-md bg-paw-blue px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Portal
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
        {GROUPS.map((group) => (
          <div key={group.heading}>
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {group.heading}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map(({ label, icon: Icon, to, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-paw-blue/10 text-paw-blue"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
