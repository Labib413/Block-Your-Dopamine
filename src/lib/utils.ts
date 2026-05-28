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
 * Validates a URL against safe protocols.
 */
export function isValidUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  // Clean URL
  const trimmedUrl = url.trim();

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'vbscript:', 'data:text/html'];
  if (dangerousProtocols.some(p => trimmedUrl.toLowerCase().startsWith(p))) {
    return false;
  }

  // Allow safe protocols
  const safeProtocols = ['http:', 'https:', 'blob:', 'data:image/'];
  if (safeProtocols.some(p => trimmedUrl.toLowerCase().startsWith(p))) {
    return true;
  }

  // If it's a domain-like string (e.g., "google.com"), we'll treat it as safe
  // since the app often prepends https:// later, but we should be careful.
  // This regex supports domains, localhost, and IP addresses.
  const domainRegex = /^(([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,24}|localhost|(\d{1,3}\.){3}\d{1,3})(:\d+)?(\/.*)?$/i;
  if (domainRegex.test(trimmedUrl)) {
    return true;
  }

  return false;
}

/**
 * Securely opens a new window with a validated URL and noopener/noreferrer.
 */
export function safeOpen(url: string, target = '_blank', features = ''): Window | null {
  if (!isValidUrl(url)) {
    console.error('Blocked attempt to open unsafe URL:', url);
    return null;
  }

  // Ensure absolute URL
  const finalUrl = url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')
    ? url
    : `https://${url}`;

  const finalFeatures = features
    ? `${features},noopener,noreferrer`
    : 'noopener,noreferrer';

  const win = window.open(finalUrl, target, finalFeatures);
  if (win) {
    win.opener = null;
  }
  return win;
}
