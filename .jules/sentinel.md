## 2026-06-11 - Defensive URL Handling and Window Security
**Vulnerability:** XSS via `javascript:` URIs in user-provided links and Reverse Tabnabbing via `window.open` without `noopener,noreferrer`.
**Learning:** React's `<a>` tags and `window.open` calls with user-provided data can be high-risk vectors for XSS and navigation hijacking if not strictly validated and sanitized. Using `target="_blank"` without `rel="noopener noreferrer"` (or setting `opener = null`) allows the target page to control the parent window.
**Prevention:** Implement a centralized `isValidUrl` whitelist-based validator and a `safeOpen` wrapper that enforces security headers and resets the `opener` property. Apply these utilities globally across the UI.
