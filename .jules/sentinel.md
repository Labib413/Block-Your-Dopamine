## 2025-05-15 - [Secure Window Management & URL Validation]
**Vulnerability:** Reverse Tabnabbing and URI-based XSS (javascript:).
**Learning:** Using `noopener` in `window.open` features string prevents the method from returning a window handle in modern browsers, which breaks application logic that needs to track window state (like `.closed`).
**Prevention:** Manually set `win.opener = null` after calling `window.open` without `noopener` to maintain both security and functional tracking. Always validate URLs with a strict protocol whitelist before opening.
