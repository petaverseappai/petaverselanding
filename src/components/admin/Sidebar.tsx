import { NavLink } from "react-router-dom";
import { LayoutDashboard, Mails, Users, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/constants/routes";

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, to: ROUTES.ADMIN },
  { label: "Waitlist", icon: Mails, to: ROUTES.ADMIN_WAITLIST },
  { label: "Users", icon: Users, to: ROUTES.ADMIN_USERS },
];

export function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-white">
      <div className="flex items-center gap-2 px-5 py-5 border-b">
        <span className="text-base font-bold text-gray-900">PetaVerse</span>
        <span className="rounded-md bg-paw-orange px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">Admin</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {NAV.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === ROUTES.ADMIN}
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
