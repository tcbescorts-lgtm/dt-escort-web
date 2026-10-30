import "server-only";

export const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"];
export const MAX_BYTES = 10 * 1024 * 1024;

/** Validates an uploaded File; returns an error message or null. */
export function checkFile(f: File | null): string | null {
  if (!f || f.size === 0) return "Choose a file.";
  if (f.size > MAX_BYTES) return "Files must be 10 MB or smaller.";
  if (!ALLOWED_TYPES.includes(f.type)) return "Upload a PDF, JPG, PNG, WEBP or HEIC file.";
  return null;
}

export function safeName(name: string) {
  return name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(-80) || "file";
}
