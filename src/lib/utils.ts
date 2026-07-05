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
 * Validates a URL to prevent XSS (javascript:) and other malicious protocols.
 */
export function isValidUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();

  // Explicitly block javascript: protocol
  if (trimmed.toLowerCase().startsWith('javascript:')) {
    return false;
  }

  try {
    // Check if the URL has a protocol. If not, assume https for validation.
    // This regex checks for a protocol-like start (e.g., http://, mailto:, etc.)
    let urlToParse = trimmed;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
      urlToParse = `https://${trimmed}`;
    }

    const parsed = new URL(urlToParse);
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:', 'blob:', 'data:'];

    if (!allowedProtocols.includes(parsed.protocol.toLowerCase())) {
      return false;
    }

    // Additional check for web protocols to ensure they have a valid hostname
    if (['http:', 'https:'].includes(parsed.protocol.toLowerCase())) {
      // Must have at least one dot in hostname or be localhost
      return parsed.hostname === 'localhost' || parsed.hostname.includes('.');
    }

    return true;
  } catch (e) {
    // If URL parsing fails, it might be an invalid URL
    return false;
  }
}

/**
 * Safely opens a URL in a new tab with security best practices.
 * Prevents reverse tabnabbing and validates the URL.
 */
export function safeOpen(url: string | null | undefined, target = '_blank', features = ''): Window | null {
  if (!url || !isValidUrl(url)) {
    console.error('Blocked attempt to open invalid or unsafe URL:', url);
    return null;
  }

  let finalUrl = url.trim();
  if (!finalUrl.startsWith('http') && !finalUrl.startsWith('mailto:') && !finalUrl.startsWith('tel:') && !finalUrl.startsWith('blob:') && !finalUrl.startsWith('data:')) {
    finalUrl = `https://${finalUrl}`;
  }

  // Security features to prevent reverse tabnabbing
  const securityFeatures = target === '_self' ? features : `noopener,noreferrer${features ? `,${features}` : ''}`;

  const win = window.open(finalUrl, target, securityFeatures);

  // For extra security in older browsers
  if (win && target !== '_self') {
    win.opener = null;
  }

  return win;
}
