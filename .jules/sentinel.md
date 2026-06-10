## 2026-06-10 - Secure External Link Handling
**Vulnerability:** Reverse tabnabbing and potential URI-based XSS via `window.open` calls with unsanitized user-provided or external URLs.
**Learning:** Monolithic usage of `window.open` across various components (DistractionGuard, FullscreenDetox, PersonalPanel) without protocol validation or `opener` isolation creates a broad attack surface for phishing and script execution.
**Prevention:** Centralize external link opening in a `safeOpen` utility that enforces `isValidUrl` validation (whitelisting safe protocols and restricting `data:` URIs) and ensures `win.opener = null` for all `_blank` targets.
