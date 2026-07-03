# Sentinel's Journal - Critical Security Learnings

## 2026-07-03 - Secure Navigation & Input Validation Pattern
**Vulnerability:** Reverse tabnabbing via unsafe `window.open` and potential XSS/Phishing via unvalidated user-provided URLs.
**Learning:** The application frequently allows users to input external URLs (resources, guarded sites) and opens them in new tabs. Without `noopener,noreferrer`, the target page can access `window.opener`, and without validation, `javascript:` URIs can be injected.
**Prevention:** Always use the `safeOpen` utility for external navigation and `isValidUrl` for any user-provided URL input to ensure protocol safety and cross-origin isolation.
