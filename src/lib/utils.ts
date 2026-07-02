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
 * Validates a URL for security and format.
 * Prevents javascript: XSS and ensures valid protocols.
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();

  if (trimmed.toLowerCase().startsWith('javascript:')) return false;

  try {
    const parsed = new URL(trimmed);
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:', 'blob:', 'data:'];
    if (!allowedProtocols.includes(parsed.protocol)) return false;

    // Restrict data: URLs to safe image types
    if (parsed.protocol === 'data:') {
      return /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/.test(trimmed);
    }

    // Ensure http/https URLs have a valid hostname
    if (['http:', 'https:'].includes(parsed.protocol)) {
      return parsed.hostname.length > 0 && (parsed.hostname.includes('.') || parsed.hostname === 'localhost');
    }

    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Secure wrapper for window.open that prevents reverse tabnabbing (target="_blank" vulnerability)
 * and validates the URL before opening.
 */
export function safeOpen(url: string, target = '_blank', features = ''): Window | null {
  if (!isValidUrl(url)) {
    console.error('[Sentinel] Blocked unsafe or invalid URL:', url);
    return null;
  }

  // Security: Always add noopener,noreferrer for target="_blank"
  const finalFeatures = target === '_self'
    ? features
    : `${features}${features ? ',' : ''}noopener,noreferrer`;

  const win = window.open(url, target, finalFeatures);

  // Extra layer of protection for older browsers
  if (win && target !== '_self') {
    win.opener = null;
  }

  return win;
}
