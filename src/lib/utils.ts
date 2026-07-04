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
 * Validates if a URL is safe to use in the application.
 * Whitelists common protocols and blocks dangerous ones like 'javascript:'.
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();

  // Explicitly block javascript: protocol
  if (trimmed.toLowerCase().startsWith('javascript:')) {
    return false;
  }

  try {
    // Try parsing as an absolute URL
    const parsed = new URL(trimmed);
    const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:', 'blob:', 'data:'];
    return safeProtocols.includes(parsed.protocol);
  } catch (e) {
    // Handle relative paths or domain-only strings
    if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
      return true;
    }

    // Check for domain-like strings (e.g., "google.com")
    // This allows users to enter "google.com" instead of "https://google.com"
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z0-9-.]+[a-zA-Z0-9/._-]*$/;
    if (domainRegex.test(trimmed)) {
      return true;
    }

    return false;
  }
}

/**
 * Safely opens a URL in a new window/tab, preventing reverse tabnabbing.
 * Automatically adds https:// to domain-only strings.
 */
export function safeOpen(url: string, target = '_blank', features = ''): Window | null {
  if (!isValidUrl(url)) {
    console.warn('Blocked opening of unsafe URL:', url);
    return null;
  }

  let finalUrl = url.trim();
  // Add https:// if it looks like a domain without a protocol
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(finalUrl) &&
      !finalUrl.startsWith('mailto:') &&
      !finalUrl.startsWith('tel:') &&
      !finalUrl.startsWith('/') &&
      !finalUrl.startsWith('.')) {
    finalUrl = 'https://' + finalUrl;
  }

  const relFeatures = target !== '_self' ? 'noopener,noreferrer' : '';
  const combinedFeatures = [features, relFeatures].filter(Boolean).join(',');

  const win = window.open(finalUrl, target, combinedFeatures);
  if (win && target !== '_self') {
    // Defense in depth: explicitly clear the opener
    try {
      win.opener = null;
    } catch (e) {
      // Some browsers might throw or ignore
    }
  }

  return win;
}
