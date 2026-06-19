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
 * Validates a URL and ensures it doesn't use dangerous protocols.
 * Optionally prepends https:// if no protocol is present.
 */
export function isValidUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  // 1. Blacklist dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  if (dangerousProtocols.some(p => trimmed.toLowerCase().startsWith(p))) {
    return null;
  }

  // 2. Check for protocol presence
  const protocolMatch = trimmed.match(/^([a-z][a-z0-9+.-]*):/i);

  if (protocolMatch) {
    const protocol = protocolMatch[1].toLowerCase() + ':';
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:', 'blob:'];

    if (allowedProtocols.includes(protocol)) {
      return trimmed;
    }

    // 3. Distinguish between unknown protocol and hostname:port
    // If it's NOT an allowed protocol, check if it's a hostname with a port
    // e.g., localhost:3000 or mysite.com:8080
    const rest = trimmed.slice(protocolMatch[0].length);
    const isLikelyPort = /^[0-9]+(\/|$)/.test(rest);

    if (isLikelyPort) {
      return `https://${trimmed}`;
    }

    return null;
  }

  // 4. No protocol at all, assume it's a hostname and prepend https://
  return `https://${trimmed}`;
}

/**
 * Secure wrapper for window.open to prevent reverse tabnabbing.
 */
export function safeOpen(url: string | null | undefined, target = '_blank', features = ''): Window | null {
  const validatedUrl = isValidUrl(url);
  if (!validatedUrl) return null;

  // Add noopener to features if target is _blank
  let finalFeatures = features;
  if (target === '_blank' && !features.includes('noopener')) {
    finalFeatures = features ? `${features},noopener` : 'noopener';
  }

  const win = window.open(validatedUrl, target, finalFeatures);
  if (win && target === '_blank') {
    // Standard security practice to prevent reverse tabnabbing
    win.opener = null;
  }
  return win;
}
