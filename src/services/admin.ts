import { api } from "@/services/axios";
import type { AuthResponse } from "@/types/auth.types";
import type {
  PagedResult,
  WaitlistResponse,
  WaitlistEntry,
  DashboardSummary,
  TimeseriesResponse,
  TimeseriesMetric,
  TimeseriesRange,
  TimeseriesBucket,
  ReportListItem,
  ReportDetail,
  ResolveReportRequest,
  ModerationStats,
  ReportTargetType,
  UserListItem,
  UserDetail,
  UserPet,
  LookupType,
  LookupItem,
  LookupWriteRequest,
  AdoptionListing,
  LostFoundReport,
  CommunityListItem,
  CommunityDetail,
  PostListItem,
  BroadcastRequest,
  BroadcastResponse,
  AuditEntry,
  RecurringJob,
  HealthResponse,
  AppConfig,
  FeedAnalytics,
  FeedEngagement,
  PetHealthAnalytics,
  ServicesAnalytics,
  ChatAnalytics,
  MediaAnalytics,
  NotificationsAnalytics,
} from "@/types/admin.types";

// ---------------------------------------------------------------------------
// Auth (§2)
// ---------------------------------------------------------------------------

export async function adminLogin(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/admin-login", { email, password });
  return data;
}

// ---------------------------------------------------------------------------
// Helper: strip undefined/empty params so they don't hit the wire
// ---------------------------------------------------------------------------

function params(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Dashboard (§3)
// ---------------------------------------------------------------------------

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>("/admin/dashboard/summary");
  return data;
}

export async function getDashboardTimeseries(query: {
  metric: TimeseriesMetric;
  range: TimeseriesRange;
  bucket: TimeseriesBucket;
}): Promise<TimeseriesResponse> {
  const { data } = await api.get<TimeseriesResponse>("/admin/dashboard/timeseries", {
    params: query,
  });
  return data;
}

// ---------------------------------------------------------------------------
// Moderation (§4)
// ---------------------------------------------------------------------------

export async function getModerationReports(query: {
  status?: number;
  reason?: number;
  targetType?: ReportTargetType;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<ReportListItem>> {
  const { data } = await api.get<PagedResult<ReportListItem>>("/admin/moderation/reports", {
    params: params(query),
  });
  return data;
}

export async function getModerationReport(id: number): Promise<ReportDetail> {
  const { data } = await api.get<ReportDetail>(`/admin/moderation/reports/${id}`);
  return data;
}

export async function claimReport(id: number): Promise<ReportDetail> {
  const { data } = await api.post<ReportDetail>(`/admin/moderation/reports/${id}/claim`);
  return data;
}

export async function resolveReport(
  id: number,
  body: ResolveReportRequest,
): Promise<ReportDetail> {
  const { data } = await api.post<ReportDetail>(
    `/admin/moderation/reports/${id}/resolve`,
    body,
  );
  return data;
}

export async function getModerationStats(): Promise<ModerationStats> {
  const { data } = await api.get<ModerationStats>("/admin/moderation/stats");
  return data;
}

// ---------------------------------------------------------------------------
// Users (§5)
// ---------------------------------------------------------------------------

export async function getUsers(query: {
  search?: string;
  role?: string;
  status?: string;
  verified?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<UserListItem>> {
  const { data } = await api.get<PagedResult<UserListItem>>("/admin/users", {
    params: params(query),
  });
  return data;
}

export async function getUser(id: string): Promise<UserDetail> {
  const { data } = await api.get<UserDetail>(`/admin/users/${id}`);
  return data;
}

export async function getUserPets(
  id: string,
  query: { page?: number; pageSize?: number } = {},
): Promise<PagedResult<UserPet>> {
  const { data } = await api.get<PagedResult<UserPet>>(`/admin/users/${id}/pets`, {
    params: params(query),
  });
  return data;
}

export async function updateUserRoles(id: string, roles: string[]): Promise<UserDetail> {
  const { data } = await api.put<UserDetail>(`/admin/users/${id}/roles`, { roles });
  return data;
}

export async function suspendUser(
  id: string,
  body: { days: number; reason: string },
): Promise<UserDetail> {
  const { data } = await api.post<UserDetail>(`/admin/users/${id}/suspend`, body);
  return data;
}

export async function banUser(id: string, body: { reason: string }): Promise<UserDetail> {
  const { data } = await api.post<UserDetail>(`/admin/users/${id}/ban`, body);
  return data;
}

export async function reinstateUser(id: string): Promise<UserDetail> {
  const { data } = await api.post<UserDetail>(`/admin/users/${id}/reinstate`);
  return data;
}

export async function forceVerifyPhone(id: string): Promise<void> {
  await api.post(`/admin/users/${id}/force-verify-phone`);
}

export async function revokeUserSessions(id: string): Promise<void> {
  await api.post(`/admin/users/${id}/revoke-sessions`);
}

// ---------------------------------------------------------------------------
// Lookups (§6)
// ---------------------------------------------------------------------------

export async function getLookupTypes(): Promise<LookupType[]> {
  const { data } = await api.get<LookupType[]>("/admin/lookups/types");
  return data;
}

export async function getLookupItems(
  type: LookupType,
  query: { search?: string; page?: number; pageSize?: number } = {},
): Promise<PagedResult<LookupItem>> {
  const { data } = await api.get<PagedResult<LookupItem>>(`/admin/lookups/${type}`, {
    params: params(query),
  });
  return data;
}

export async function createLookup(
  type: LookupType,
  body: LookupWriteRequest,
): Promise<LookupItem> {
  const { data } = await api.post<LookupItem>(`/admin/lookups/${type}`, body);
  return data;
}

export async function updateLookup(
  type: LookupType,
  id: number,
  body: LookupWriteRequest,
): Promise<LookupItem> {
  const { data } = await api.put<LookupItem>(`/admin/lookups/${type}/${id}`, body);
  return data;
}

export async function deleteLookup(type: LookupType, id: number): Promise<void> {
  await api.delete(`/admin/lookups/${type}/${id}`);
}

// ---------------------------------------------------------------------------
// Content oversight (§7)
// ---------------------------------------------------------------------------

// Adoption
export async function getAdoptionListings(query: {
  status?: number;
  type?: "rehome" | "shelter_stray";
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<AdoptionListing>> {
  const { data } = await api.get<PagedResult<AdoptionListing>>("/admin/adoption/listings", {
    params: params(query),
  });
  return data;
}

export async function closeAdoptionListing(id: number, reason: string): Promise<void> {
  await api.post(`/admin/adoption/listings/${id}/close`, { reason });
}

// Lost & Found
export async function getLostFoundReports(query: {
  type?: "lost" | "found";
  status?: "active" | "resolved";
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<LostFoundReport>> {
  const { data } = await api.get<PagedResult<LostFoundReport>>("/admin/lostfound/reports", {
    params: params(query),
  });
  return data;
}

export async function resolveLostFound(id: number): Promise<void> {
  await api.post(`/admin/lostfound/reports/${id}/resolve`);
}

export async function removeLostFound(id: number): Promise<void> {
  await api.post(`/admin/lostfound/reports/${id}/remove`);
}

// Communities
export async function getCommunities(query: {
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<CommunityListItem>> {
  const { data } = await api.get<PagedResult<CommunityListItem>>("/admin/communities", {
    params: params(query),
  });
  return data;
}

export async function getCommunity(id: number): Promise<CommunityDetail> {
  const { data } = await api.get<CommunityDetail>(`/admin/communities/${id}`);
  return data;
}

export async function archiveCommunity(id: number): Promise<void> {
  await api.post(`/admin/communities/${id}/archive`);
}

export async function reassignCommunityOwner(id: number, newLeadPetId: number): Promise<void> {
  await api.put(`/admin/communities/${id}/owner`, { newLeadPetId });
}

// Posts
export async function getPosts(query: {
  communityId?: number;
  authorPetId?: number;
  visibility?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<PostListItem>> {
  const { data } = await api.get<PagedResult<PostListItem>>("/admin/posts", {
    params: params(query),
  });
  return data;
}

export async function deletePost(id: number): Promise<void> {
  await api.delete(`/admin/posts/${id}`);
}

// ---------------------------------------------------------------------------
// Communications (§8)
// ---------------------------------------------------------------------------

export async function sendBroadcast(body: BroadcastRequest): Promise<BroadcastResponse> {
  const { data } = await api.post<BroadcastResponse>("/admin/broadcast", body);
  return data;
}

export async function getAdminWaitlist(query: {
  page?: number;
  pageSize?: number;
} = {}): Promise<PagedResult<WaitlistEntry>> {
  const { data } = await api.get<PagedResult<WaitlistEntry>>("/admin/waitlist", {
    params: params(query),
  });
  return data;
}

export function adminWaitlistExportUrl(): string {
  const base = api.defaults.baseURL ?? "";
  return `${base.replace(/\/$/, "")}/admin/waitlist/export`;
}

export async function downloadWaitlistCsv(): Promise<Blob> {
  const { data } = await api.get("/admin/waitlist/export", { responseType: "blob" });
  return data as Blob;
}

// Legacy waitlist (still used by the current dashboard tile)
export async function getWaitlist(): Promise<WaitlistResponse> {
  const { data } = await api.get<WaitlistResponse>("/waitlist");
  return data;
}

// ---------------------------------------------------------------------------
// Audit (§9)
// ---------------------------------------------------------------------------

export async function getAuditLog(query: {
  actorUserId?: string;
  action?: string;
  targetType?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<AuditEntry>> {
  const { data } = await api.get<PagedResult<AuditEntry>>("/admin/audit", {
    params: params(query),
  });
  return data;
}

// ---------------------------------------------------------------------------
// Operations (§10)
// ---------------------------------------------------------------------------

export async function getJobs(): Promise<RecurringJob[]> {
  const { data } = await api.get<RecurringJob[]>("/admin/jobs");
  return data;
}

export async function triggerJob(name: string): Promise<void> {
  await api.post(`/admin/jobs/${name}/trigger`);
}

export async function getHealth(): Promise<HealthResponse> {
  const { data } = await api.get<HealthResponse>("/admin/health");
  return data;
}

// ---------------------------------------------------------------------------
// App Config (§11)
// ---------------------------------------------------------------------------

export async function getAppConfig(): Promise<AppConfig> {
  const { data } = await api.get<AppConfig>("/config");
  return data;
}

// The admin PATCH endpoint expects a flat array of { key, value } pairs
// (snake_case keys), not the nested public AppConfig shape.
interface UpdateConfigEntry {
  key: string;
  value: string;
}

const str = (v: string | number | boolean | null): string =>
  v === null ? "" : String(v);

// Flat snake_case key -> value, for the whole editable config surface.
function flattenConfig(cfg: AppConfig): Record<string, string> {
  return {
    support_email: str(cfg.supportEmail),
    support_phone: str(cfg.supportPhone),
    adoption_contact_email: str(cfg.adoptionContactEmail),
    min_app_version: str(cfg.minAppVersion),
    latest_app_version: str(cfg.latestAppVersion),
    terms_url: str(cfg.links.terms),
    privacy_url: str(cfg.links.privacy),
    help_url: str(cfg.links.help),
    app_store_url: str(cfg.links.appStore),
    play_store_url: str(cfg.links.playStore),
    maintenance_active: str(cfg.maintenance.active),
    maintenance_message: str(cfg.maintenance.message),
    maintenance_ends_at: str(cfg.maintenance.endsAt),
    feature_adoption: str(cfg.features.adoption),
    feature_ai_chat: str(cfg.features.aiChat),
    feature_lost_found: str(cfg.features.lostFound),
    map_default_lat: str(cfg.map.defaultLat),
    map_default_lng: str(cfg.map.defaultLng),
    map_default_radius_km: str(cfg.map.defaultRadiusKm),
  };
}

// Diff draft against the loaded config; emit only the entries that changed.
export async function updateAppConfig(
  draft: AppConfig,
  original: AppConfig,
): Promise<AppConfig> {
  const next = flattenConfig(draft);
  const prev = flattenConfig(original);
  const updates: UpdateConfigEntry[] = Object.keys(next)
    .filter((key) => next[key] !== prev[key])
    .map((key) => ({ key, value: next[key] }));

  if (updates.length > 0) {
    await api.patch("/config/admin", updates);
  }
  return getAppConfig();
}

// ---------------------------------------------------------------------------
// Analytics (§13)
// ---------------------------------------------------------------------------

export async function getFeedAnalytics(): Promise<FeedAnalytics> {
  const { data } = await api.get<FeedAnalytics>("/admin/analytics/feed");
  return data;
}

export async function getFeedEngagement(): Promise<FeedEngagement> {
  const { data } = await api.get<FeedEngagement>("/admin/analytics/feed/engagement");
  return data;
}

export async function getPetHealthAnalytics(): Promise<PetHealthAnalytics> {
  const { data } = await api.get<PetHealthAnalytics>("/admin/analytics/pet-health");
  return data;
}

export async function getServicesAnalytics(): Promise<ServicesAnalytics> {
  const { data } = await api.get<ServicesAnalytics>("/admin/analytics/services");
  return data;
}

export async function getChatAnalytics(): Promise<ChatAnalytics> {
  const { data } = await api.get<ChatAnalytics>("/admin/analytics/chat");
  return data;
}

export async function getMediaAnalytics(): Promise<MediaAnalytics> {
  const { data } = await api.get<MediaAnalytics>("/admin/analytics/media");
  return data;
}

export async function getNotificationsAnalytics(): Promise<NotificationsAnalytics> {
  const { data } = await api.get<NotificationsAnalytics>("/admin/analytics/notifications");
  return data;
}

export async function refreshTokens(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const { data } = await api.post<{ accessToken: string; refreshToken: string }>(
    "/auth/refresh",
    { refreshToken },
  );
  return data;
}

export async function revokeToken(refreshToken: string): Promise<void> {
  await api.post("/auth/revoke", { refreshToken });
}
