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
 * Prevents XSS attacks via javascript: or other dangerous URIs.
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string' || !url.trim()) return false;

  const trimmedUrl = url.trim();
  const lowerUrl = trimmedUrl.toLowerCase();

  // Explicitly reject javascript: protocol
  if (lowerUrl.startsWith('javascript:')) return false;

  try {
    // Check if it has a protocol
    if (/^[a-z][a-z0-9+.-]*:/i.test(trimmedUrl)) {
      const parsed = new URL(trimmedUrl);
      const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:', 'blob:', 'data:'];

      if (!safeProtocols.includes(parsed.protocol)) return false;

      // For data: URIs, only allow common safe mime types (images, pdf)
      if (parsed.protocol === 'data:') {
        return lowerUrl.startsWith('data:image/') || lowerUrl.startsWith('data:application/pdf');
      }

      return true;
    }

    // Allow relative paths and common hostname formats (e.g., google.com)
    return trimmedUrl.startsWith('/') ||
           trimmedUrl.startsWith('./') ||
           trimmedUrl.startsWith('../') ||
           /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}/i.test(trimmedUrl);
  } catch (e) {
    // If URL parsing fails but it doesn't look like a protocol,
    // it might be a partial hostname which is fine as we often prepend https://
    return !trimmedUrl.includes(':');
  }
}

/**
 * A secure wrapper for window.open that prevents Reverse Tabnabbing
 * and validates the URL to prevent XSS.
 */
export function safeOpen(url: string, target = '_blank', features = ''): Window | null {
  if (!isValidUrl(url)) {
    console.error('Sentinel: Blocked opening potentially unsafe URL:', url);
    return null;
  }

  // Prepend https:// if it looks like a hostname without a protocol
  let finalUrl = url;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(url) && !url.startsWith('/')) {
    finalUrl = 'https://' + url;
  }

  // Prevent Reverse Tabnabbing by ensuring noopener/noreferrer for _blank
  let finalFeatures = features;
  if (target === '_blank') {
    if (!finalFeatures) {
      finalFeatures = 'noopener,noreferrer';
    } else {
      if (!finalFeatures.includes('noopener')) finalFeatures += (finalFeatures ? ',' : '') + 'noopener';
      if (!finalFeatures.includes('noreferrer')) finalFeatures += (finalFeatures ? ',' : '') + 'noreferrer';
    }
  }

  const win = window.open(finalUrl, target, finalFeatures);

  // Extra layer of protection for browsers that support it
  if (win && target === '_blank') {
    try {
      win.opener = null;
    } catch (e) {
      // Ignore
    }
  }

  return win;
}
