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
 * Validates a URL against a whitelist of safe protocols.
 * Prevents javascript: URI-based XSS attacks.
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false;

  // Allow relative paths
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
    return true;
  }

  try {
    const parsed = new URL(url);
    const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:', 'blob:'];

    if (safeProtocols.includes(parsed.protocol)) {
      return true;
    }

    // Strictly validate data URIs for images or PDFs
    if (parsed.protocol === 'data:') {
      return url.startsWith('data:image/') || url.startsWith('data:application/pdf');
    }

    return false;
  } catch (e) {
    // If it's not a valid URL but we didn't catch it as relative, it's unsafe
    return false;
  }
}

/**
 * Safely opens a URL in a new window/tab.
 * Mitigates "Reverse Tabnabbing" by setting noopener/noreferrer and clearing window.opener.
 */
export function safeOpen(url: string, target = '_blank', features?: string): Window | null {
  if (!isValidUrl(url)) {
    console.warn('Blocked opening invalid/unsafe URL:', url);
    return null;
  }

  // Force noopener,noreferrer for security
  const baseFeatures = 'noopener,noreferrer';
  const combinedFeatures = features ? `${baseFeatures},${features}` : baseFeatures;

  const win = window.open(url, target, combinedFeatures);

  if (win) {
    // Extra precaution to sever the window relationship
    win.opener = null;
  }

  return win;
}
