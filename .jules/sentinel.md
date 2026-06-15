## 2026-06-11 - Robust URL Validation Pattern
**Vulnerability:** XSS via `javascript:` URIs and Reverse Tabnabbing in `window.open` calls.
**Learning:** Simple string prefixing (e.g., prepending `https://`) can inadvertently bypass security checks if the original string already contains a protocol. Robust validation must explicitly blacklist known dangerous protocols and use reliable regex-based protocol detection.
**Prevention:** Use the `isValidUrl` and `safeOpen` utilities in `src/lib/utils.ts` for all external link handling. Always set `opener = null` and include `noopener` for `_blank` targets.
