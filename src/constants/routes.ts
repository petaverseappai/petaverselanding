export const ROUTES = {
  LANDING: "/",
  SHARE: "/p/:id",
  RESET_PASSWORD: "/reset-password",
  PRIVACY: "/privacy",
  TERMS: "/terms",
  COMMUNITY_GUIDELINES: "/community-guidelines",

  ADMIN: "/admin",
  ADMIN_LOGIN: "/admin/login",

  // Dashboard is the index (ADMIN)
  ADMIN_MODERATION: "/admin/moderation",
  ADMIN_MODERATION_DETAIL: "/admin/moderation/:id",
  ADMIN_USERS: "/admin/users",
  ADMIN_USER_DETAIL: "/admin/users/:id",
  ADMIN_LOOKUPS: "/admin/lookups",
  ADMIN_ADOPTION: "/admin/adoption",
  ADMIN_LOSTFOUND: "/admin/lostfound",
  ADMIN_COMMUNITIES: "/admin/communities",
  ADMIN_COMMUNITY_DETAIL: "/admin/communities/:id",
  ADMIN_POSTS: "/admin/posts",
  ADMIN_BROADCAST: "/admin/broadcast",
  ADMIN_WAITLIST: "/admin/waitlist",
  ADMIN_AUDIT: "/admin/audit",
  ADMIN_OPERATIONS: "/admin/operations",
  ADMIN_CONFIG: "/admin/config",
  ADMIN_ANALYTICS: "/admin/analytics",
  ADMIN_SECURITY: "/admin/security",
  ADMIN_LEGAL: "/admin/legal",
  ADMIN_SERVICE_PROVIDERS: "/admin/service-providers",
  ADMIN_SERVICE_PROVIDER_DETAIL: "/admin/service-providers/:id",
  ADMIN_OTP: "/admin/otp",
  ADMIN_AWS: "/admin/aws",
} as const;

// Helpers for building parameterized paths
export const adminPaths = {
  moderationDetail: (id: number | string) => `/admin/moderation/${id}`,
  userDetail: (id: string) => `/admin/users/${id}`,
  communityDetail: (id: number | string) => `/admin/communities/${id}`,
  serviceProviderDetail: (id: number | string) => `/admin/service-providers/${id}`,
};

export const sharePaths = {
  post: (id: string | number) => `/p/${id}`,
};
