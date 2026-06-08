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
 * Validates if a URL is safe to open.
 * Rejects javascript: URIs and only allows a whitelist of protocols.
 */
export function isValidUrl(url: string | null | undefined): boolean {
  if (!url || !url.trim()) return false;

  const trimmedUrl = url.trim();

  // Allow relative paths
  if (trimmedUrl.startsWith('/') || trimmedUrl.startsWith('./') || trimmedUrl.startsWith('../')) {
    return true;
  }

  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const parsed = new URL(trimmedUrl, base);
    const protocol = parsed.protocol.toLowerCase();

    // Whitelist safe protocols
    const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:', 'blob:'];
    if (safeProtocols.includes(protocol)) return true;

    // Special handling for data URIs - only allow images and PDFs
    if (protocol === 'data:') {
      return trimmedUrl.startsWith('data:image/') || trimmedUrl.startsWith('data:application/pdf');
    }

    return false;
  } catch (e) {
    // If it's not a valid URL format but doesn't have a dangerous protocol prefix,
    // we still reject it to be safe, unless it's a simple fragment/relative path
    return false;
  }
}

/**
 * Safely opens a URL in a new window/tab.
 * Mitigates reverse tabnabbing and URI-based XSS.
 */
export function safeOpen(url: string, target = '_blank', features?: string): Window | null {
  if (!isValidUrl(url)) {
    console.error('Blocked attempt to open unsafe URL:', url);
    return null;
  }

  // If features is undefined, omit it to allow "open in new tab" behavior.
  // Otherwise, ensure noopener is omitted from features to allow returning the window handle,
  // then manually set opener to null for security.
  const win = features !== undefined
    ? window.open(url, target, features)
    : window.open(url, target);

  if (win) {
    win.opener = null;
  }
  return win;
}
