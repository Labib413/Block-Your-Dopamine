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
 * Validates a URL against a whitelist of safe protocols and basic format.
 * Prevents javascript: injection and other protocol-based attacks.
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();

  // Explicitly block javascript: protocol
  if (trimmed.toLowerCase().startsWith('javascript:')) return false;

  try {
    // If it's a relative URL or missing protocol, try prepending https for validation
    const testUrl = trimmed.includes('://') ? trimmed : `https://${trimmed}`;
    const parsed = new URL(testUrl);

    // Whitelist safe protocols
    const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:', 'blob:', 'data:'];
    if (!safeProtocols.includes(parsed.protocol.toLowerCase())) return false;

    // For web protocols, ensure there is a valid-looking host
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
 * Safely opens a URL in a new window/tab, preventing reverse tabnabbing
 * and validating the URL before navigation.
 */
export function safeOpen(url: string, target = '_blank', features = ''): Window | null {
  if (!isValidUrl(url)) {
    console.error('[Sentinel] Blocked attempt to open unsafe URL:', url);
    return null;
  }

  // Ensure absolute URL
  let finalUrl = url.trim();
  if (!finalUrl.includes('://') && !finalUrl.startsWith('mailto:') && !finalUrl.startsWith('tel:')) {
    finalUrl = `https://${finalUrl}`;
  }

  // Security features: noopener and noreferrer are critical for cross-origin security
  const securityFeatures = 'noopener,noreferrer';
  const finalFeatures = target !== '_self'
    ? (features ? `${features},${securityFeatures}` : securityFeatures)
    : features;

  const win = window.open(finalUrl, target, finalFeatures);

  // Explicitly break the opener connection for added security
  if (win && target !== '_self') {
    try {
      win.opener = null;
    } catch (e) {
      // Ignore errors if win is cross-origin
    }
  }

  return win;
}
