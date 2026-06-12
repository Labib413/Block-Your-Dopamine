## 2026-06-12 - [Safe URL Handling and Tabnabbing Prevention]
**Vulnerability:** User-provided URLs (via `prompt`) were used in `SyllabusView.tsx` without validation, allowing `javascript:` URIs (XSS). Additionally, multiple components used `window.open(url, '_blank')` without setting `opener = null`, making the app vulnerable to reverse tabnabbing.
**Learning:** Centralizing security utilities like `isValidUrl` and `safeOpen` in `src/lib/utils.ts` ensures consistent enforcement across the codebase and simplifies auditing.
**Prevention:** Always use `safeOpen` instead of raw `window.open` for external links and validate any user-inputted URLs with `isValidUrl` before processing or storing them.
