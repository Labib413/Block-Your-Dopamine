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

/**
 * Validates a URL against a whitelist of protocols and patterns.
 * Prevents javascript: and other dangerous protocols.
 */
export function isValidUrl(url: string | null | undefined): boolean {
  if (!url || !url.trim()) return false;

  try {
    // Handle relative URLs
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const parsed = new URL(url, base);

    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:', 'blob:'];
    if (allowedProtocols.includes(parsed.protocol)) {
      return true;
    }

    // Special handling for data: URLs (only allow images and PDFs)
    if (parsed.protocol === 'data:') {
      const allowedMimeTypes = ['data:image/', 'data:application/pdf'];
      return allowedMimeTypes.some(mime => url.startsWith(mime));
    }

    return false;
  } catch (e) {
    // If URL parsing fails but it's a relative path, it might be valid for the app
    return url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
  }
}

/**
 * Safely opens a URL in a new window/tab.
 * Prevents reverse tabnabbing and validates the URL.
 */
export function safeOpen(url: string | null | undefined, target = '_blank', features?: string): Window | null {
  if (!isValidUrl(url)) {
    console.warn('Blocked attempt to open invalid or unsafe URL:', url);
    return null;
  }

  // Only pass features if defined to avoid breaking default browser behavior
  const win = features
    ? window.open(url!, target, features)
    : window.open(url!, target);

  if (win && target === '_blank') {
    try {
      win.opener = null;
    } catch (e) {
      // Ignore errors in environments where win.opener is restricted
    }
  }
  return win;
}
