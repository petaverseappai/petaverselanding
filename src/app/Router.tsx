import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import LandingPage from "@/pages/landing/LandingPage";
import LoginPage from "@/pages/admin/LoginPage";
import DashboardPage from "@/pages/admin/DashboardPage";
import WaitlistPage from "@/pages/admin/WaitlistPage";
import UsersPage from "@/pages/admin/UsersPage";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.LANDING} element={<LandingPage />} />
        <Route path={ROUTES.ADMIN_LOGIN} element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path={ROUTES.ADMIN} element={<DashboardPage />} />
          <Route path={ROUTES.ADMIN_WAITLIST} element={<WaitlistPage />} />
          <Route path={ROUTES.ADMIN_USERS} element={<UsersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
