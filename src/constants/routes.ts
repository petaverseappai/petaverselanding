export const ROUTES = {
  LANDING: "/",

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
} as const;

// Helpers for building parameterized paths
export const adminPaths = {
  moderationDetail: (id: number | string) => `/admin/moderation/${id}`,
  userDetail: (id: string) => `/admin/users/${id}`,
  communityDetail: (id: number | string) => `/admin/communities/${id}`,
};
