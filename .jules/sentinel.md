## 2025-05-15 - Reverse Tabnabbing and XSS Protection

**Vulnerability:**
The application had multiple instances where `window.open(url, '_blank')` was used without `noopener`, making it vulnerable to reverse tabnabbing. Additionally, user-provided URLs in `SyllabusView.tsx` were not validated, allowing potential XSS via `javascript:` URIs.

**Learning:**
Relying on manual `window.open` calls across different components is error-prone. A centralized utility like `safeOpen` ensures that security best practices (like `noopener` and `opener = null`) are consistently applied. URL validation must handle edge cases like relative paths and `domain:port` formats to remain functional while being secure.

**Prevention:**
Always use the `safeOpen` utility for external navigation and `isValidUrl` for any user-provided URLs. Avoid direct `window.open` calls.
