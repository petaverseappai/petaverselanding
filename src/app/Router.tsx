import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import LandingPage from "@/pages/landing/LandingPage";
import NotFoundPage from "@/pages/NotFoundPage";
import SharePage from "@/pages/share/SharePage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import PrivacyPage from "@/pages/legal/PrivacyPage";
import TermsPage from "@/pages/legal/TermsPage";
import CommunityGuidelinesPage from "@/pages/legal/CommunityGuidelinesPage";
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
import LegalPage from "@/pages/admin/LegalPage";
import OtpDashboardPage from "@/pages/admin/OtpDashboardPage";
import AwsDashboardPage from "@/pages/admin/AwsDashboardPage";
import VisionProfilesPage from "@/pages/admin/VisionProfilesPage";
import VisionProfileDetailPage from "@/pages/admin/VisionProfileDetailPage";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PortalProtectedRoute } from "@/components/portal/PortalProtectedRoute";
import { PortalLayout } from "@/components/portal/PortalLayout";
import PortalLoginPage from "@/pages/portal/LoginPage";
import PortalNoPagePage from "@/pages/portal/NoPagePage";
import PortalDashboardPage from "@/pages/portal/DashboardPage";
import PortalSettingsPage from "@/pages/portal/SettingsPage";
import PortalPostsPage from "@/pages/portal/PostsPage";
import PortalCreatePostPage from "@/pages/portal/CreatePostPage";
import PortalCreatePostWithListingPage from "@/pages/portal/CreatePostWithListingPage";
import PortalListingsPage from "@/pages/portal/ListingsPage";
import PortalCreateListingPage from "@/pages/portal/CreateListingPage";
import PortalListingDetailPage from "@/pages/portal/ListingDetailPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.LANDING} element={<LandingPage />} />
        <Route path={ROUTES.SHARE} element={<SharePage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
        <Route path={ROUTES.PRIVACY} element={<PrivacyPage />} />
        <Route path={ROUTES.TERMS} element={<TermsPage />} />
        <Route path={ROUTES.COMMUNITY_GUIDELINES} element={<CommunityGuidelinesPage />} />
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
          <Route path={ROUTES.ADMIN_OTP} element={<OtpDashboardPage />} />
          <Route path={ROUTES.ADMIN_AWS} element={<AwsDashboardPage />} />
          <Route path={ROUTES.ADMIN_OPERATIONS} element={<OperationsPage />} />
          <Route path={ROUTES.ADMIN_CONFIG} element={<AppConfigPage />} />
          <Route path={ROUTES.ADMIN_ANALYTICS} element={<AnalyticsPage />} />
          <Route path={ROUTES.ADMIN_SECURITY} element={<SecurityPage />} />
          <Route path={ROUTES.ADMIN_LEGAL} element={<LegalPage />} />
          <Route path={ROUTES.ADMIN_VISION_PROFILES} element={<VisionProfilesPage />} />
          <Route path={ROUTES.ADMIN_VISION_PROFILE_DETAIL} element={<VisionProfileDetailPage />} />
        </Route>
        <Route path={ROUTES.PORTAL_LOGIN} element={<PortalLoginPage />} />
        <Route path={ROUTES.PORTAL_NO_PAGE} element={<PortalNoPagePage />} />
        <Route
          element={
            <PortalProtectedRoute>
              <PortalLayout />
            </PortalProtectedRoute>
          }
        >
          <Route path={ROUTES.PORTAL} element={<Navigate to={ROUTES.PORTAL_DASHBOARD} replace />} />
          <Route path={ROUTES.PORTAL_DASHBOARD} element={<PortalDashboardPage />} />
          <Route path={ROUTES.PORTAL_SETTINGS} element={<PortalSettingsPage />} />
          <Route path={ROUTES.PORTAL_POSTS} element={<PortalPostsPage />} />
          <Route path={ROUTES.PORTAL_POSTS_NEW} element={<PortalCreatePostPage />} />
          <Route path={ROUTES.PORTAL_POSTS_NEW_WITH_LISTING} element={<PortalCreatePostWithListingPage />} />
          <Route path={ROUTES.PORTAL_LISTINGS} element={<PortalListingsPage />} />
          <Route path={ROUTES.PORTAL_LISTINGS_NEW} element={<PortalCreateListingPage />} />
          <Route path={ROUTES.PORTAL_LISTING_DETAIL} element={<PortalListingDetailPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
