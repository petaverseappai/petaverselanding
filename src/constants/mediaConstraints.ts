import { MediaCategory } from "@/constants/mediaCategory";

// ---------------------------------------------------------------------------
// Media upload constraints
//
// Mirrors the mobile client contract documented in
// petaverse.mobile/docs/backend-media-upload-dto.md so the website enforces the
// same allow-list and size/duration caps client-side, surfacing a clean error
// before the upload instead of relying on a backend rejection.
// ---------------------------------------------------------------------------

const MB = 1024 * 1024;

// Allowed content types. Images normally arrive as JPEG (mobile downscales and
// transcodes everything to JPEG before upload); the others are compressor
// fallbacks. HEIC/HEIF are deliberately rejected: they only reach us on a
// compressor failure and would store an unplayable file.
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

export const REJECTED_IMAGE_TYPES = ["image/heic", "image/heif"] as const;

// Categories that accept video (and therefore the video caps below). Mirrors
// the mobile table: only story and post allow video.
export const VIDEO_CATEGORIES: ReadonlySet<MediaCategory> = new Set([
  MediaCategory.Story,
  MediaCategory.Post,
]);

export const MAX_VIDEO_BYTES = 100 * MB;
export const MAX_VIDEO_DURATION_SECONDS = 60;

// JPEG quality used when re-encoding after downscale (mobile uses 82).
export const JPEG_QUALITY = 0.82;

// Longest-edge downscale targets. Avatars/banners are shown small (1080);
// everything else (post/report/adoption/document) targets 1920. Mirrors
// MediaConstraints.maxDimensionFor in the mobile client.
const AVATAR_MAX_DIMENSION = 1080;
const IMAGE_MAX_DIMENSION = 1920;

const AVATAR_DIMENSION_CATEGORIES: ReadonlySet<MediaCategory> = new Set([
  MediaCategory.UserAvatar,
  MediaCategory.PetAvatar,
  MediaCategory.CommunityAvatar,
  MediaCategory.CommunityBanner,
  MediaCategory.ProviderLogo,
  MediaCategory.ProviderBanner,
]);

export function maxDimensionFor(category: MediaCategory): number {
  return AVATAR_DIMENSION_CATEGORIES.has(category)
    ? AVATAR_MAX_DIMENSION
    : IMAGE_MAX_DIMENSION;
}

// Per-category image size caps (bytes). Provider logo/banner are website-only
// categories not in the mobile table; the backend treats them as images, so we
// apply a conservative image cap here too.
const IMAGE_SIZE_CAP: Record<MediaCategory, number> = {
  [MediaCategory.UserAvatar]: 5 * MB,
  [MediaCategory.PetAvatar]: 5 * MB,
  [MediaCategory.Story]: 15 * MB,
  [MediaCategory.Post]: 15 * MB,
  [MediaCategory.PetDocument]: 15 * MB,
  [MediaCategory.PetReport]: 15 * MB,
  [MediaCategory.AdoptionListingPhoto]: 15 * MB,
  [MediaCategory.CommunityAvatar]: 5 * MB,
  [MediaCategory.CommunityBanner]: 8 * MB,
  [MediaCategory.ProviderLogo]: 5 * MB,
  [MediaCategory.ProviderBanner]: 8 * MB,
};

function formatMb(bytes: number): string {
  return `${Math.round(bytes / MB)} MB`;
}

/**
 * Probe a video file's duration (seconds) via an off-screen <video> element.
 * Resolves null if the duration cannot be read (e.g. unsupported container),
 * leaving the duration cap to the backend.
 */
export function probeVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    const cleanup = () => URL.revokeObjectURL(url);
    video.onloadedmetadata = () => {
      cleanup();
      const d = video.duration;
      resolve(Number.isFinite(d) ? Math.round(d) : null);
    };
    video.onerror = () => {
      cleanup();
      resolve(null);
    };
    video.src = url;
  });
}

/**
 * Validate a file against the allow-list and the category's size/duration caps.
 * Returns an error message to show the user, or null if the file is acceptable.
 * `durationSeconds` is the probed video length (null for images / unknown).
 */
export function validateMediaFile(
  file: File,
  category: MediaCategory,
  durationSeconds: number | null,
): string | null {
  const type = file.type.toLowerCase();
  const isVideo = type.startsWith("video/");

  if (isVideo) {
    if (!VIDEO_CATEGORIES.has(category)) {
      return "Videos are not allowed here. Please choose an image.";
    }
    if (!ALLOWED_VIDEO_TYPES.includes(type as (typeof ALLOWED_VIDEO_TYPES)[number])) {
      return "Unsupported video format. Use MP4, MOV, or WebM.";
    }
    if (file.size > MAX_VIDEO_BYTES) {
      return `Video is too large. Maximum size is ${formatMb(MAX_VIDEO_BYTES)}.`;
    }
    if (durationSeconds !== null && durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
      return `Video is too long. Maximum length is ${MAX_VIDEO_DURATION_SECONDS} seconds.`;
    }
    return null;
  }

  // Images.
  if (REJECTED_IMAGE_TYPES.includes(type as (typeof REJECTED_IMAGE_TYPES)[number])) {
    return "HEIC images are not supported. Please convert to JPEG first.";
  }
  if (!ALLOWED_IMAGE_TYPES.includes(type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "Unsupported image format. Use JPEG, PNG, or WebP.";
  }
  const cap = IMAGE_SIZE_CAP[category];
  if (cap && file.size > cap) {
    return `Image is too large. Maximum size is ${formatMb(cap)}.`;
  }
  return null;
}
