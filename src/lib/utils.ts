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
 * Validates a URL to prevent XSS via javascript: URIs and other dangerous protocols.
 * Allows safe protocols (http, https, mailto, tel, blob) and relative paths.
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false;

  const trimmedUrl = url.trim();

  // Explicitly block javascript: and other dangerous protocols
  // This regex matches a protocol (alphabetic followed by colon)
  // but NOT a hostname:port pattern (e.g., localhost:3000)
  const protocolMatch = trimmedUrl.match(/^[a-z]+:(?!\d+)/i);
  if (protocolMatch) {
    const protocol = protocolMatch[0].toLowerCase();
    const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:', 'blob:'];

    // If it's a known dangerous protocol, block it
    if (!safeProtocols.includes(protocol)) return false;

    // For non-http/https safe protocols, we can stop here
    if (protocol !== 'http:' && protocol !== 'https:') return true;
  }

  // Allow relative paths
  if (trimmedUrl.startsWith('/') || trimmedUrl.startsWith('./') || trimmedUrl.startsWith('../')) {
    return true;
  }

  try {
    // Basic domain/protocol check for http/https URLs
    const urlObj = new URL(trimmedUrl.startsWith('http') ? trimmedUrl : 'https://' + trimmedUrl);
    // Ensure it has a valid hostname (or is localhost)
    return !!(urlObj.protocol && (urlObj.hostname.includes('.') || urlObj.hostname === 'localhost'));
  } catch (e) {
    return false;
  }
}

/**
 * Secure wrapper for window.open that prevents Reverse Tabnabbing.
 * Automatically validates URL and appends 'noopener' to features.
 */
export function safeOpen(url: string, target = '_blank', features = ''): Window | null {
  if (!isValidUrl(url)) {
    console.error('🛡️ Sentinel: Blocked navigation to unsafe URL:', url);
    return null;
  }

  // Use a secure set of features, especially for non-self targets
  let finalFeatures = features;
  if (target !== '_self') {
    if (!finalFeatures.includes('noopener')) {
      finalFeatures = finalFeatures ? `${finalFeatures},noopener` : 'noopener';
    }
  }

  const win = window.open(url, target, finalFeatures);

  // Defense in depth: explicitly nullify opener for non-self targets
  if (win && target !== '_self') {
    try {
      win.opener = null;
    } catch (e) {
      // Ignore errors if window is already restricted
    }
  }

  return win;
}
