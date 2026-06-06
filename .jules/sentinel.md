## 2025-05-15 - [Secure URL Handling & Tabnabbing Prevention]
**Vulnerability:** Reverse Tabnabbing and XSS via `javascript:` URIs or unvalidated user-provided links.
**Learning:** External links and window openings (`window.open`) can allow a malicious child page to control the parent window via `window.opener`. Additionally, unvalidated `img src` or `a href` attributes can execute arbitrary scripts if they use the `javascript:` protocol.
**Prevention:**
1. Use `rel="noopener noreferrer"` on all external links.
2. Centralize URL validation with a whitelist of protocols (http, https, etc.) and strictly block `javascript:`.
3. Use a secure wrapper like `safeOpen` that manually nullifies `win.opener = null` if the window handle is needed for tracking, or uses `noopener` features otherwise.
