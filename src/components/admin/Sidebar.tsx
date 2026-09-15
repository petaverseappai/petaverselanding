import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShieldAlert,
  Users,
  Database,
  Heart,
  Search,
  Users2,
  FileText,
  Megaphone,
  Mails,
  ScrollText,
  Activity,
  Settings,
  LogOut,
  BarChart2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/constants/routes";

type NavItem = { label: string; icon: React.ElementType; to: string; end?: boolean };
type NavGroup = { heading: string; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    heading: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, to: ROUTES.ADMIN, end: true },
      { label: "Analytics", icon: BarChart2, to: ROUTES.ADMIN_ANALYTICS },
      { label: "Moderation", icon: ShieldAlert, to: ROUTES.ADMIN_MODERATION },
    ],
  },
  {
    heading: "People",
    items: [
      { label: "Users", icon: Users, to: ROUTES.ADMIN_USERS },
    ],
  },
  {
    heading: "Content",
    items: [
      { label: "Adoption", icon: Heart, to: ROUTES.ADMIN_ADOPTION },
      { label: "Lost & Found", icon: Search, to: ROUTES.ADMIN_LOSTFOUND },
      { label: "Communities", icon: Users2, to: ROUTES.ADMIN_COMMUNITIES },
      { label: "Posts", icon: FileText, to: ROUTES.ADMIN_POSTS },
    ],
  },
  {
    heading: "System",
    items: [
      { label: "Lookups", icon: Database, to: ROUTES.ADMIN_LOOKUPS },
      { label: "Broadcast", icon: Megaphone, to: ROUTES.ADMIN_BROADCAST },
      { label: "Waitlist", icon: Mails, to: ROUTES.ADMIN_WAITLIST },
      { label: "Audit log", icon: ScrollText, to: ROUTES.ADMIN_AUDIT },
      { label: "Operations", icon: Activity, to: ROUTES.ADMIN_OPERATIONS },
      { label: "App Config", icon: Settings, to: ROUTES.ADMIN_CONFIG },
    ],
  },
];

export function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r bg-white">
      <div className="flex items-center gap-2 border-b px-5 py-5">
        <span className="text-base font-bold text-gray-900">PetaVerse</span>
        <span className="rounded-md bg-paw-orange px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Admin
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
                        ? "bg-paw-orange/10 text-paw-orange"
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
