import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import LandingPage from "@/pages/landing/LandingPage";
import LoginPage from "@/pages/admin/LoginPage";
import DashboardPage from "@/pages/admin/DashboardPage";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.LANDING} element={<LandingPage />} />
        <Route path={ROUTES.ADMIN_LOGIN} element={<LoginPage />} />
        <Route
          path={ROUTES.ADMIN}
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
