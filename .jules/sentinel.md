## 2025-05-22 - [Secure Link Opening & URL Validation]
**Vulnerability:** Reverse tabnabbing and URI-based XSS (javascript:).
**Learning:** External links and user-provided URLs (avatars, badges) lacked validation, potentially allowing malicious redirections or script execution.
**Prevention:** Implement and use centralized utilities like `isValidUrl` and `safeOpen` to enforce strict protocol whitelisting and secure window behavior (noopener, noreferrer).
