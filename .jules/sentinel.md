# Sentinel Security Journal

## 2025-05-15 - Initial Security Audit & URL Sanitization
**Vulnerability:** XSS via `javascript:` URIs in profile avatars and unsafe `window.open` calls with user-provided URLs. Missing `noopener,noreferrer` protections on external links.
**Learning:** The application allows users to provide URLs for avatars and guarded websites, which are then rendered or opened without sufficient validation.
**Prevention:** Implement a central `isValidUrl` utility and apply it to all user-controlled URL inputs and renderings.
