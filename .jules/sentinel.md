## 2026-06-11 - [Reusable Security Pattern: Safe URL Handling]
**Vulnerability:** URI-based XSS (e.g., `javascript:`) and Reverse Tabnabbing in `window.open` calls.
**Learning:** The application frequently opens user-provided or external URLs in new tabs. Using a centralized `isValidUrl` whitelist and a `safeOpen` wrapper ensures consistent protection against protocol-based attacks and prevents the opened page from accessing the original window.
**Prevention:** Always use `safeOpen(url)` instead of `window.open(url)` for any external or untrusted links. Ensure `isValidUrl` is used before persisting or rendering any user-provided URIs.
