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
 * Validates if a string is a valid URL and uses an allowed protocol.
 * Mitigates XSS via javascript: URIs.
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string' || !url.trim()) return false;

  const lowerUrl = url.toLowerCase().trim();
  // Early rejection of common XSS vectors
  if (lowerUrl.startsWith('javascript:') || lowerUrl.startsWith('data:')) return false;

  try {
    // Check for a protocol (e.g., http:, mailto:, etc.)
    // We only allow http and https
    if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
      // If it has a protocol but doesn't have ://, it might be something like mailto:
      // However, google.com:8080 also matches this regex.
      // We check if it's followed by //
      if (!url.includes('://')) {
        // If no ://, check if it's just a hostname with a port
        if (url.includes(':')) {
          const parts = url.split(':');
          const port = parts[parts.length - 1];
          if (!/^\d+$/.test(port)) {
            // Not a port, likely another protocol
            const parsed = new URL(url);
            return ['http:', 'https:'].includes(parsed.protocol);
          }
        }
      } else {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      }
    }

    // Try parsing as https
    const parsed = new URL('https://' + url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch (e) {
    return false;
  }
}

/**
 * Safely opens a URL in a new window/tab.
 * Mitigates Reverse Tabnabbing by setting opener to null.
 */
export function safeOpen(url: string, target = '_blank', features = ''): Window | null {
  if (!isValidUrl(url)) {
    console.error('Blocked attempt to open invalid or insecure URL:', url);
    return null;
  }

  // Ensure 'noopener' is present for _blank targets
  let finalFeatures = features;
  if (target === '_blank' && !features.includes('noopener')) {
    finalFeatures = features ? `${features},noopener` : 'noopener';
  }

  const win = window.open(url, target, finalFeatures);
  if (win && target === '_blank') {
    win.opener = null;
  }
  return win;
}
