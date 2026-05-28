## 2025-05-15 - Hardening URLs and mitigating Reverse Tabnabbing
**Vulnerability:** XSS via dangerous URL schemes (javascript:, vbscript:, etc.) and Reverse Tabnabbing in `window.open` calls.
**Learning:** The application allows users to input URLs for resources and avatar URLs. Without validation, these can be used to execute arbitrary JS. Also, opening external links without `noopener,noreferrer` allows the target page to control the opener window.
**Prevention:** Always validate URLs using a central utility like `isValidUrl` before rendering them in `img` tags or using them in `window.open`. Always use `noopener,noreferrer` for external links.
