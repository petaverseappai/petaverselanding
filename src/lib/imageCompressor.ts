import { MediaCategory } from "@/constants/mediaCategory";
import { JPEG_QUALITY, maxDimensionFor } from "@/constants/mediaConstraints";

// ---------------------------------------------------------------------------
// Client-side image compression
//
// Mirrors the mobile client (flutter_image_compress, JPEG quality 82): decode
// the picked image, downscale so its longest edge fits the category target, and
// re-encode as JPEG. Re-encoding through a canvas also drops EXIF (so location
// metadata doesn't leak) and transcodes anything the browser can decode to JPEG,
// so the backend and every display surface only ever see web-friendly formats.
//
// Browsers cannot decode HEIC/HEIF on a canvas, so those fail here and fall back
// to the original file; the upload validator then rejects them, matching the
// documented "reject HEIC" behavior.
// ---------------------------------------------------------------------------

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to decode image"));
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
  });
}

/**
 * Compress an image file for its upload category. Returns a new JPEG File, or
 * the original file if compression fails for any reason (unsupported codec,
 * OOM): a pick never dead-ends, and the upload validator still enforces the hard
 * caps afterwards. Non-image files are returned untouched (videos upload as-is).
 */
export async function compressImage(file: File, category: MediaCategory): Promise<File> {
  if (!file.type.toLowerCase().startsWith("image/")) return file;

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const maxEdge = maxDimensionFor(category);

    const longest = Math.max(img.width, img.height);
    const scale = longest > maxEdge ? maxEdge / longest : 1;
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, JPEG_QUALITY);
    if (!blob) return file;

    // Never ship a larger file than the original (e.g. a small already-optimized
    // JPEG that the re-encode inflates).
    if (blob.size >= file.size && scale === 1) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}
