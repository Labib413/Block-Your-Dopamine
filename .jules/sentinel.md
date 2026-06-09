## 2025-05-14 - [Safe URL Opening and Validation]
**Vulnerability:** Reverse tabnabbing and URI-based XSS (via `javascript:` protocol) in direct `window.open` calls.
**Learning:** React applications frequently use `window.open` for external resources without validating the URL or clearing `window.opener`, leaving them vulnerable to simple but effective redirection attacks.
**Prevention:** Centralize all external URL opening through a `safeOpen` utility that validates against a protocol whitelist and explicitly sets `win.opener = null` for new tabs.
