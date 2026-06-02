## 2025-05-22 - Secure URL Handling & Reverse Tabnabbing Mitigation
**Vulnerability:** Reverse Tabnabbing and URI-based XSS via `window.open` and `img src` attributes.
**Learning:** External links opened with `target="_blank"` can access the original window via `window.opener`, posing a security risk if the destination is malicious. Additionally, unvalidated user-provided URLs (like avatars) can lead to XSS via `javascript:` URIs.
**Prevention:** Always use a secure wrapper for `window.open` that enforces `noopener,noreferrer` and sets `opener = null`. Use a whitelist-based URL validator to filter protocols before rendering links or images.
