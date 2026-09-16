// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface PageQuery {
  page?: number;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// Waitlist (legacy + admin)
// ---------------------------------------------------------------------------

export interface WaitlistEntry {
  id: number;
  email: string;
  joinedAt: string;
}

// Legacy GET /waitlist shape
export interface WaitlistResponse {
  total: number;
  entries: WaitlistEntry[];
}

// ---------------------------------------------------------------------------
// Dashboard (§3)
// ---------------------------------------------------------------------------

export interface DashboardSummary {
  users: {
    total: number;
    new24h: number;
    new7d: number;
    new30d: number;
    pendingPhoneVerification: number;
    byRole: Record<string, number>;
  };
  pets: { total: number; new7d: number };
  adoption: { activeListings: number; openRequests: number; completed30d: number };
  lostFound: { activeReports: number; resolved30d: number };
  community: {
    communities: number;
    posts7d: number;
    comments7d: number;
    upcomingEvents: number;
  };
  moderation: { openReports: number; underReview: number };
}

export type TimeseriesMetric = "users" | "pets" | "posts" | "reports" | "adoptions";
export type TimeseriesRange = "7d" | "30d" | "90d";
export type TimeseriesBucket = "day" | "week";

export interface TimeseriesPoint {
  date: string;
  value: number;
}

export interface TimeseriesResponse {
  metric: TimeseriesMetric;
  range: TimeseriesRange;
  points: TimeseriesPoint[];
}

// ---------------------------------------------------------------------------
// Moderation (§4)
// ---------------------------------------------------------------------------

export const REPORT_STATUS = {
  0: "Open",
  1: "UnderReview",
  2: "ActionTaken",
  3: "Dismissed",
} as const;

export const REPORT_REASON = {
  0: "Inappropriate",
  1: "Spam",
  2: "Harassment",
  3: "Misinformation",
  4: "Violence",
  5: "Other",
} as const;

export type ReportTargetType = "post" | "comment" | "pet";

export interface ReportReporter {
  petId: number;
  petName: string;
  ownerUserId: string;
  ownerName: string;
}

export interface ReportListItem {
  id: number;
  targetType: ReportTargetType;
  targetId: number;
  reason: number;
  reasonName: string;
  details: string | null;
  status: number;
  statusName: string;
  reporter: ReportReporter;
  reportCountForTarget: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReportTargetPost {
  kind: "post";
  id: number;
  petId: number;
  authorPetName: string;
  text: string;
  visibility: string;
  media: string[];
  createdAt: string;
  isDeleted: boolean;
}

export interface ReportTargetComment {
  kind: "comment";
  id: number;
  postId: number;
  petId: number;
  authorPetName: string;
  text: string;
  createdAt: string;
  isDeleted: boolean;
}

export interface ReportTargetPet {
  kind: "pet";
  id: number;
  name: string;
  ownerUserId: string;
  avatarUrl: string | null;
}

export type ReportTarget =
  | ReportTargetPost
  | ReportTargetComment
  | ReportTargetPet;

export interface RelatedReport {
  id: number;
  reason: number;
  reasonName: string;
  createdAt: string;
}

export interface ReportDetail extends ReportListItem {
  target: ReportTarget | null;
  relatedReports: RelatedReport[];
}

export type ReportDecision = "action_taken" | "dismissed";
export type ContentAction = "remove" | "none";
export type UserActionKind = "none" | "warn" | "suspend" | "ban";

export interface ResolveReportRequest {
  decision: ReportDecision;
  contentAction?: ContentAction;
  userAction?: UserActionKind;
  suspendDays?: number;
  note?: string;
}

export interface ModerationStats {
  open: number;
  underReview: number;
  actionedLast7d: number;
  dismissedLast7d: number;
  topReasons: { reason: number; reasonName: string; count: number }[];
}

// ---------------------------------------------------------------------------
// Users (§5)
// ---------------------------------------------------------------------------

export type UserStatus = "Active" | "Suspended" | "Banned";
export type UserRole = "User" | "Vet" | "ServiceProvider" | "Admin";

export interface UserListItem {
  id: string;
  userCode: string;
  firstName: string;
  lastName: string;
  email: string;
  emailConfirmed: boolean;
  mobileNumber: string;
  phoneConfirmed: boolean;
  roles: string[];
  status: UserStatus;
  petCount: number;
  locationName: string | null;
  createdAt: string;
}

export interface UserDetail {
  id: string;
  userCode: string;
  firstName: string;
  lastName: string;
  email: string;
  emailConfirmed: boolean;
  pendingEmail: string | null;
  mobileNumber: string;
  phoneConfirmed: boolean;
  dateOfBirth: string | null;
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
  avatarUrl: string | null;
  roles: string[];
  status: UserStatus;
  suspendedUntil: string | null;
  counts: {
    pets: number;
    posts: number;
    communities: number;
    reportsFiled: number;
    reportsAgainst: number;
    adoptionListings: number;
    lostFoundReports: number;
  };
  createdAt: string;
}

export interface UserPet {
  id: number;
  name: string;
  species: string | null;
  breed: string | null;
  avatarUrl: string | null;
  isPrimaryOwner: boolean;
}

// ---------------------------------------------------------------------------
// Lookups (§6)
// ---------------------------------------------------------------------------

export type LookupType =
  | "species"
  | "breeds"
  | "vaccines"
  | "medications"
  | "petsizes"
  | "coatcolors"
  | "serviceprovidertypes"
  | "specializations"
  | "statuses";

export interface LookupItem {
  id: number;
  name: string;
  extra: Record<string, unknown> | null;
}

export interface LookupWriteRequest {
  name: string;
  extra?: Record<string, unknown> | null;
}

// enum-seeded types: rename only, no create/delete
export const ENUM_SEEDED_LOOKUPS: LookupType[] = [
  "petsizes",
  "coatcolors",
  "statuses",
];

// ---------------------------------------------------------------------------
// Content oversight (§7)
// ---------------------------------------------------------------------------

export interface AdoptionListing {
  id: number;
  type: "rehome" | "shelter_stray";
  petName: string;
  petId: number;
  listerUserId: string;
  listerName: string;
  statusId: number;
  statusName: string;
  locationLabel: string | null;
  createdAt: string;
}

export interface LostFoundReport {
  id: number;
  type: "lost" | "found";
  petName: string;
  reporterUserId: string;
  reporterName: string;
  statusId: number;
  statusName: string;
  reward: number | null;
  lastSeenAddress: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface CommunityListItem {
  id: number;
  name: string;
  handle: string;
  category: string;
  leadPetId: number;
  leadPetName: string;
  memberCount: number;
  postCount: number;
  isDeleted: boolean;
  createdAt: string;
}

export interface CommunityDetail extends CommunityListItem {
  description: string | null;
  leadOwnerUserId: string;
}

export interface PostListItem {
  id: number;
  authorPetId: number;
  authorPetName: string;
  communityId: number | null;
  caption: string | null;
  visibility: string;
  likeCount: number;
  commentCount: number;
  isDeleted: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Communications (§8)
// ---------------------------------------------------------------------------

export type BroadcastChannel = "push" | "email" | "both";

export interface BroadcastRequest {
  channel: BroadcastChannel;
  title: string;
  body: string;
  segment: { roles: string[] | null; region: string | null };
}

export interface BroadcastResponse {
  queuedRecipients: number;
}

// ---------------------------------------------------------------------------
// Audit (§9)
// ---------------------------------------------------------------------------

export interface AuditEntry {
  id: number;
  actor: { userId: string; name: string };
  action: string;
  targetType: string;
  targetId: string;
  summary: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export const AUDIT_ACTIONS = [
  "user.roles",
  "user.suspend",
  "user.ban",
  "user.reinstate",
  "user.warn",
  "user.force_verify_phone",
  "user.revoke_sessions",
  "moderation.claim",
  "moderation.resolve",
  "lookup.create",
  "lookup.update",
  "lookup.delete",
  "adoption.close",
  "lostfound.resolve",
  "lostfound.remove",
  "community.archive",
  "community.reassign_owner",
  "post.delete",
  "broadcast.send",
] as const;

// ---------------------------------------------------------------------------
// Operations (§10)
// ---------------------------------------------------------------------------

export interface RecurringJob {
  name: string;
  id: string;
  cron: string;
  lastExecution: string | null;
  lastResult: string | null;
  nextExecution: string | null;
}

export const TRIGGERABLE_JOBS = [
  "appointment-reminders",
  "medication-overdue",
  "vaccination-due",
] as const;

export interface HealthResponse {
  status: "Healthy" | "Unhealthy";
  checks: Record<string, "up" | "down">;
}


// ---------------------------------------------------------------------------
// App Config (§11)
// ---------------------------------------------------------------------------

export interface AppConfig {
  supportEmail: string;
  supportPhone: string;
  adoptionContactEmail: string;
  minAppVersion: string;
  latestAppVersion: string;
  links: {
    terms: string;
    privacy: string;
    help: string;
    appStore: string;
    playStore: string;
  };
  maintenance: {
    active: boolean;
    message: string;
    endsAt: string | null;
  };
  features: {
    adoption: boolean;
    aiChat: boolean;
    lostFound: boolean;
  };
  map: {
    defaultLat: number;
    defaultLng: number;
    defaultRadiusKm: number;
  };
}

// ---------------------------------------------------------------------------
// Analytics (§13)
// ---------------------------------------------------------------------------

export interface FeedAnalytics {
  totalPosts: number;
  postsToday: number;
  posts7d: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSaves: number;
  totalFollows: number;
  totalBlocks: number;
  visibilityBreakdown: { public: number; followers: number; private: number };
  topHashtags: { tag: string; postCount: number }[];
  topPetsByFollowers: { petId: number; petName: string; ownerName: string; value: number }[];
  topPetsByPosts: { petId: number; petName: string; ownerName: string; value: number }[];
}

export interface FeedEngagement {
  avgLikesPerPost: number;
  avgCommentsPerPost: number;
  avgSharesPerPost: number;
  postsWith0Engagement: number;
  postsWith1to10Likes: number;
  postsWith10PlusLikes: number;
}

export interface PetHealthAnalytics {
  totalPets: number;
  petsWithVaccinations: number;
  petsWithOverdueVaccinations: number;
  petsWithActiveMedications: number;
  petsWithOverdueMedications: number;
  petsWithHealthConditions: number;
  petsWithWeightHistory: number;
  petsWithActivityRecords: number;
  sterilization: { sterilized: number; notSterilized: number; unknown: number };
  topVaccines: { vaccineId: number; vaccineName: string; count: number }[];
  topMedications: { medicationId: number; medicationName: string; count: number }[];
  healthBySpecies: { speciesId: number; speciesName: string; petCount: number; conditionCount: number }[];
}

export interface ServicesAnalytics {
  totalProviders: number;
  verifiedProviders: number;
  vetProviders: number;
  providersWithNoAppointments: number;
  appointments: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    appointmentsThisWeek: number;
    appointmentsThisMonth: number;
  };
  averageRating: number;
  totalRatings: number;
  topRatedProviders: {
    providerId: number;
    name: string;
    isVet: boolean;
    avgRating: number;
    ratingCount: number;
    appointmentCount: number;
  }[];
  byProviderType: { typeId: number; typeName: string; count: number }[];
}

export interface ChatAnalytics {
  totalSessions: number;
  activeSessions: number;
  archivedSessions: number;
  sessionsThisWeek: number;
  sessionsThisMonth: number;
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  petSpecificSessions: number;
  generalSessions: number;
  uniqueUsersThisWeek: number;
  avgMessagesPerSession: number;
  byModel: { modelId: string; messageCount: number; inputTokens: number; outputTokens: number }[];
}

export interface MediaAnalytics {
  totalAssets: number;
  confirmedAssets: number;
  unconfirmedAssets: number;
  orphanedAssets: number;
  totalSizeBytes: number;
  confirmedSizeBytes: number;
  byCategory: { category: string; count: number; sizeBytes: number }[];
  assetsUploadedToday: number;
  assetsUploadedThisWeek: number;
}

export interface NotificationsAnalytics {
  totalDeviceTokens: number;
  ioSTokens: number;
  androidTokens: number;
  usersWithNoDevices: number;
  staleTokens: number;
  totalUnreadNotifications: number;
  optOutRates: {
    medicationOptOut: number;
    vaccinationOptOut: number;
    appointmentOptOut: number;
    communityInteractionsOptOut: number;
    newFollowerOptOut: number;
    mentionsOptOut: number;
    adoptionOptOut: number;
    coOwnershipOptOut: number;
    lostPetNearbyOptOut: number;
    totalUsersWithPreferences: number;
  };
  unreadByType: { type: string; count: number }[];
}
