import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import LandingPage from "@/pages/landing/LandingPage";
import SharePage from "@/pages/share/SharePage";
import LoginPage from "@/pages/admin/LoginPage";
import DashboardPage from "@/pages/admin/DashboardPage";
import ModerationPage from "@/pages/admin/ModerationPage";
import ModerationDetailPage from "@/pages/admin/ModerationDetailPage";
import UsersPage from "@/pages/admin/UsersPage";
import UserDetailPage from "@/pages/admin/UserDetailPage";
import LookupsPage from "@/pages/admin/LookupsPage";
import AdoptionPage from "@/pages/admin/AdoptionPage";
import LostFoundPage from "@/pages/admin/LostFoundPage";
import CommunitiesPage from "@/pages/admin/CommunitiesPage";
import ServiceProvidersPage from "@/pages/admin/ServiceProvidersPage";
import ServiceProviderDetailPage from "@/pages/admin/ServiceProviderDetailPage";
import CommunityDetailPage from "@/pages/admin/CommunityDetailPage";
import PostsPage from "@/pages/admin/PostsPage";
import BroadcastPage from "@/pages/admin/BroadcastPage";
import WaitlistPage from "@/pages/admin/WaitlistPage";
import AuditPage from "@/pages/admin/AuditPage";
import OperationsPage from "@/pages/admin/OperationsPage";
import AppConfigPage from "@/pages/admin/AppConfigPage";
import AnalyticsPage from "@/pages/admin/AnalyticsPage";
import SecurityPage from "@/pages/admin/SecurityPage";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.LANDING} element={<LandingPage />} />
        <Route path={ROUTES.SHARE} element={<SharePage />} />
        <Route path={ROUTES.ADMIN_LOGIN} element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path={ROUTES.ADMIN} element={<DashboardPage />} />
          <Route path={ROUTES.ADMIN_MODERATION} element={<ModerationPage />} />
          <Route path={ROUTES.ADMIN_MODERATION_DETAIL} element={<ModerationDetailPage />} />
          <Route path={ROUTES.ADMIN_USERS} element={<UsersPage />} />
          <Route path={ROUTES.ADMIN_USER_DETAIL} element={<UserDetailPage />} />
          <Route path={ROUTES.ADMIN_LOOKUPS} element={<LookupsPage />} />
          <Route path={ROUTES.ADMIN_ADOPTION} element={<AdoptionPage />} />
          <Route path={ROUTES.ADMIN_LOSTFOUND} element={<LostFoundPage />} />
          <Route path={ROUTES.ADMIN_COMMUNITIES} element={<CommunitiesPage />} />
          <Route path={ROUTES.ADMIN_COMMUNITY_DETAIL} element={<CommunityDetailPage />} />
          <Route path={ROUTES.ADMIN_SERVICE_PROVIDERS} element={<ServiceProvidersPage />} />
          <Route path={ROUTES.ADMIN_SERVICE_PROVIDER_DETAIL} element={<ServiceProviderDetailPage />} />
          <Route path={ROUTES.ADMIN_POSTS} element={<PostsPage />} />
          <Route path={ROUTES.ADMIN_BROADCAST} element={<BroadcastPage />} />
          <Route path={ROUTES.ADMIN_WAITLIST} element={<WaitlistPage />} />
          <Route path={ROUTES.ADMIN_AUDIT} element={<AuditPage />} />
          <Route path={ROUTES.ADMIN_OPERATIONS} element={<OperationsPage />} />
          <Route path={ROUTES.ADMIN_CONFIG} element={<AppConfigPage />} />
          <Route path={ROUTES.ADMIN_ANALYTICS} element={<AnalyticsPage />} />
          <Route path={ROUTES.ADMIN_SECURITY} element={<SecurityPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
