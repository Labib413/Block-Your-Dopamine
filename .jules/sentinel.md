## 2025-05-14 - Secure external navigation and URL validation

**Vulnerability:** Reverse tabnabbing (target="_blank" without noopener) and client-side XSS via javascript: URIs in user-provided resource links.
**Learning:** Standard window.open and prompt-to-link patterns in React are vulnerable to simple exploits if not wrapped in validation and security-header logic.
**Prevention:** Always use a 'safeOpen' wrapper that sets win.opener = null and validates URLs against a strict whitelist (http, https, mailto, etc.) using a central 'isValidUrl' utility.
