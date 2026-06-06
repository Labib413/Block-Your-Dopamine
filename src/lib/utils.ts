import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const s = Math.trunc(seconds || 0);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);

  return `${hours}h ${minutes}m`;
}

export function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Validates a URL to prevent XSS and other malicious links.
 * Allows http, https, mailto, tel, blob, and data:image/ protocols.
 */
export function isValidUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string' || !url.trim()) return false;

  const trimmedUrl = url.trim();

  // Prevent javascript: protocol
  if (trimmedUrl.toLowerCase().startsWith('javascript:')) {
    return false;
  }

  // Allow relative paths
  if (trimmedUrl.startsWith('/') || trimmedUrl.startsWith('./') || trimmedUrl.startsWith('../')) {
    return true;
  }

  try {
    const parsed = new URL(trimmedUrl);
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:', 'blob:'];

    if (allowedProtocols.includes(parsed.protocol)) {
      return true;
    }

    // Specifically allow data:image/ URIs for avatars and badges
    if (parsed.protocol === 'data:' && trimmedUrl.toLowerCase().startsWith('data:image/')) {
      return true;
    }

    return false;
  } catch (e) {
    // If it's not a valid absolute URL (e.g. "google.com"),
    // ensure it doesn't contain a colon (which might indicate a protocol)
    // or starts with // (protocol-relative)
    return !trimmedUrl.includes(':') || trimmedUrl.startsWith('//');
  }
}

/**
 * A secure wrapper for window.open to prevent reverse tabnabbing.
 * Validates the URL before opening and ensures window.opener is nullified.
 */
export function safeOpen(url: string | null | undefined, target = '_blank', features = ''): Window | null {
  if (!isValidUrl(url)) {
    console.error(`Blocked attempt to open insecure URL: ${url}`);
    return null;
  }

  // We omit 'noopener' from the features string because it prevents some browsers
  // from returning the window proxy (needed for tracking if the window is closed).
  // Instead, we manually set win.opener = null below.
  const win = window.open(url!, target, features);

  if (win) {
    try {
      win.opener = null;
    } catch (e) {
      // In some environments or if cross-origin, this might fail,
      // but 'noopener' in features is the standard fallback if win handle isn't needed.
    }
  }

  return win;
}

/**
 * Generates a deterministic UUID-like string from a regular string.
 * This is useful for keeping IDs consistent for the same input.
 */
export function stringToUUID(str: string): string {
  // Simple hash function (djb2)
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  
  // Convert hash to a 32-character hex string
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const fullHex = (hex + hex + hex + hex).substring(0, 32);
  
  // Format as UUID v4-like structure (with fixed version/variant for format compliance)
  return `${fullHex.slice(0, 8)}-${fullHex.slice(8, 12)}-4${fullHex.slice(13, 16)}-a${fullHex.slice(17, 20)}-${fullHex.slice(20, 32)}`;
}

export function safeStringify(obj: any, indent?: number): string {
  const cache = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) return;
      // Skip Window objects and other circular DOM references
      if (value instanceof Window || (value.constructor && value.constructor.name === 'Window')) return;
      cache.add(value);
    }
    return value;
  }, indent);
}
