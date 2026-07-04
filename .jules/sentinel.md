# Sentinel Security Journal

## 2025-07-04 - Centralized URL Validation and Safe Navigation

**Vulnerability:** Cross-Site Scripting (XSS) via unvalidated user-provided URLs (e.g., `javascript:` protocol) and Reverse Tabnabbing via unsafe `window.open` and `<a target="_blank">` calls.
**Learning:** Decentralized input validation leads to inconsistent security posture. Multiple components were accepting URLs without protocol verification, and navigation was performed without proper security attributes.
**Prevention:** Always use centralized utilities for URL validation (`isValidUrl`) and external navigation (`safeOpen`). Ensure that `noopener,noreferrer` is used and `win.opener` is explicitly nulled for all external links.
