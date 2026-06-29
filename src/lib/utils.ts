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
 * Prevents javascript: and other dangerous protocols.
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  const trimmed = url.trim();
  // Block common XSS vectors
  if (trimmed.toLowerCase().startsWith('javascript:')) return false;
  // Block protocol-relative URLs that might point to malicious sites
  if (trimmed.startsWith('//')) return false;

  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const parsed = new URL(trimmed, base);

    const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:', 'blob:'];
    if (!safeProtocols.includes(parsed.protocol)) return false;

    // For web protocols, ensure we have a valid hostname
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      if (!parsed.hostname || (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost')) {
        return false;
      }
    }
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Securely opens a URL in a new window/tab.
 * Prevents reverse tabnabbing and validates the URL.
 */
export function safeOpen(url: string, target = '_blank', features = ''): Window | null {
  if (!isValidUrl(url)) {
    console.warn('[Security] Blocked attempt to open invalid or unsafe URL:', url);
    return null;
  }

  // Ensure noopener is present for any target that is not _self
  let secureFeatures = features;
  if (target !== '_self' && !features.includes('noopener')) {
    secureFeatures = features ? `${features},noopener` : 'noopener';
  }

  const win = window.open(url, target, secureFeatures);

  // Extra layer of protection for reverse tabnabbing
  if (win && target !== '_self') {
    try {
      win.opener = null;
    } catch (e) {
      // Some browsers might restrict this
    }
  }

  return win;
}
