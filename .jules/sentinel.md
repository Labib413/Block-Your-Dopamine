## 2025-05-22 - URL Injection & Reverse Tabnabbing Protection
**Vulnerability:** XSS via malicious URL schemes (e.g., `javascript:`) in profile avatars/resource links and reverse tabnabbing via `window.open`.
**Learning:** React's `img src` and `window.open` do not automatically sanitize protocols, allowing for arbitrary script execution or parent window hijacking. Whitelisting protocols and enforcing `noopener,noreferrer` is essential.
**Prevention:** Always use centralized `isValidUrl` and `safeOpen` utilities for any dynamic URL or external link navigation.
