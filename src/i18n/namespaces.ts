// Only "en" is populated today. Add ar/fr locale files under ./locales and
// list them in config.ts when the admin portal work picks up localization —
// the PetsApp.Api already serves en/ar/fr, so the mobile app's copy exists.
export const NAMESPACES = ["common", "nav", "landing"] as const;

export type Namespace = (typeof NAMESPACES)[number];
