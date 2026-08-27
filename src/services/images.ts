/* ---------------------------------------------------------------------------
 * Image layer — File → Blob → IndexedDB.
 * Uploads are downscaled to ≤512px and re-encoded as WebP (with graceful
 * fallback) before storage, so the vault never hoards huge originals.
 * Object URLs are cached for the app lifetime and revoked on deletion.
 * ------------------------------------------------------------------------- */
import { db } from "./db";
import { uid } from "../utils/format";
import type { ImageRecord } from "../types";

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
export const MAX_AVATAR_SIZE = 512;

export async function processImageFile(
  file: File
): Promise<{ blob: Blob; mime: string; ext: string }> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Image format not supported. Use JPG, PNG, WEBP or AVIF.");
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = objectUrl;
    await img.decode().catch(() => {
      throw new Error("Could not read this image file.");
    });
    const scale = Math.min(1, MAX_AVATAR_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process this image.");
    ctx.drawImage(img, 0, 0, w, h);

    const toBlob = (type: string, quality: number) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

    let blob = await toBlob("image/webp", 0.85);
    let mime = "image/webp";
    let ext = "webp";
    if (!blob) {
      blob = await toBlob("image/png", 1);
      mime = "image/png";
      ext = "png";
    }
    if (!blob) throw new Error("Could not process this image.");
    return { blob, mime, ext };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function storeImage(blob: Blob, mime: string, ext: string): Promise<string> {
  const id = uid();
  await db.images.put({ id, blob, mime, ext, createdAt: Date.now() });
  return id;
}

export async function removeImage(id: string): Promise<void> {
  forgetAvatarUrl(id);
  await db.images.delete(id);
}

/* --------------------------- object URL handling -------------------------- */

const urlCache = new Map<string, string>();

export async function resolveAvatarUrl(id: string): Promise<string | null> {
  const hit = urlCache.get(id);
  if (hit) return hit;
  const rec = await db.images.get(id);
  if (!rec) return null;
  const url = URL.createObjectURL(rec.blob);
  urlCache.set(id, url);
  return url;
}

export function forgetAvatarUrl(id: string): void {
  const url = urlCache.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    urlCache.delete(id);
  }
}

export async function countImages(): Promise<number> {
  return db.images.count();
}

/** Deletes image blobs no longer referenced by any contact. */
export async function pruneOrphanedImages(keepIds: Set<string>): Promise<void> {
  const all = await db.images.toArray();
  await Promise.all(all.filter((rec) => !keepIds.has(rec.id)).map((rec) => removeImage(rec.id)));
}