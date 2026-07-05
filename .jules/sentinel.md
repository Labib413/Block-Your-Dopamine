# Sentinel Journal - Critical Security Learnings

## 2025-05-15 - Protocol-Aware URL Validation
**Vulnerability:** Broken functionality for non-web protocols (mailto, tel, etc.) when implementing XSS protection.
**Learning:** Naively prepending `https://` to any string that doesn't start with `http` before parsing with `new URL()` causes other valid protocols to be treated as hostnames, which then fail hostname-specific security checks (like requiring a dot).
**Prevention:** Use a protocol-detecting regex (`/^[a-z][a-z0-9+.-]*:/i`) to verify if a protocol exists before applying default transformations. Ensure all protocol checks are case-insensitive.
