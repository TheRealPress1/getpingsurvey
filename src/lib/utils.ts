import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Build a fully qualified URL that preserves the sandbox base path in preview
export function buildPublicUrl(path: string) {
  try {
    const { origin, pathname } = window.location;
    const match = pathname.match(/^\/sandbox\/[^/]+/);
    const base = match ? match[0] : "";
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${origin}${base}${normalized}`;
  } catch {
    return path;
  }
}
