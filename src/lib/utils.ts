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
 * Prevents javascript: and other dangerous protocol injection.
 */
export function isValidUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  // Clean whitespace
  const cleanUrl = url.trim();

  // Allow relative paths
  if (cleanUrl.startsWith('/') || cleanUrl.startsWith('./') || cleanUrl.startsWith('../')) {
    return true;
  }

  // Whitelist safe protocols
  const safeProtocols = [
    'http:',
    'https:',
    'mailto:',
    'tel:',
    'blob:'
  ];

  // For data: URIs, we only allow specific mime types
  const safeDataMimeTypes = [
    'data:image/',
    'data:application/pdf'
  ];

  try {
    const parsed = new URL(cleanUrl);
    const protocol = parsed.protocol.toLowerCase();

    if (protocol === 'data:') {
      return safeDataMimeTypes.some(mime => cleanUrl.toLowerCase().startsWith(mime));
    }

    return safeProtocols.some(proto => protocol === proto.toLowerCase());
  } catch (e) {
    const lowerUrl = cleanUrl.toLowerCase();

    // Explicitly block dangerous schemes
    if (lowerUrl.startsWith('javascript:') || lowerUrl.startsWith('vbscript:') || lowerUrl.startsWith('data:text/html')) {
      return false;
    }

    return [...safeProtocols, ...safeDataMimeTypes].some(proto => lowerUrl.startsWith(proto));
  }
}

/**
 * Secure wrapper for window.open to prevent reverse tabnabbing and XSS.
 */
export function safeOpen(url: string | null | undefined, target = '_blank', features = ''): Window | null {
  if (!isValidUrl(url)) {
    console.warn('Blocked opening invalid/dangerous URL:', url);
    return null;
  }

  // Enforce noopener,noreferrer for security
  const secureFeatures = features
    ? `${features},noopener,noreferrer`
    : 'noopener,noreferrer';

  const win = window.open(url!, target, secureFeatures);
  if (win) {
    win.opener = null;
  }
  return win;
}
