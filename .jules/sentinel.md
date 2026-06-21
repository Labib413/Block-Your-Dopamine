## 2025-05-15 - [Defense in Depth for External Links]
**Vulnerability:** Reverse tabnabbing and XSS via `javascript:` protocols in user-provided resource URLs.
**Learning:** Even with `rel="noopener noreferrer"` on static `<a>` tags, direct `window.open` calls in React event handlers remained vulnerable if not wrapped in a utility that clears `window.opener`.
**Prevention:** Implement a central `safeOpen` utility that enforces `noopener` and clears `win.opener = null` for all dynamic navigation.
