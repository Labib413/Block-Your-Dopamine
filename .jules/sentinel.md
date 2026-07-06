# Sentinel Journal

## 2025-05-14 - [Tabnabbing and URL Validation]
**Vulnerability:** Reverse tabnabbing via `window.open` and Potential XSS/Open Redirection through unsanitized user-provided URLs.
**Learning:** Using `window.open` without `noopener,noreferrer` allows the opened page to access the original window via `window.opener`, posing a security risk. Additionally, simple URL validation needs to account for various protocols (mailto, tel, blob) and must not blindly prepend protocols if one already exists, which could lead to mangled URLs.
**Prevention:** Always use a central `safeOpen` utility that enforces security features and validates URLs against a whitelist of safe protocols. Ensure `isValidUrl` checks for hostnames on web protocols to prevent redirection to malicious local or malformed addresses.
