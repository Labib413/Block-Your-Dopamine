## 2025-05-15 - Reverse Tabnabbing and URI-based XSS Mitigation
**Vulnerability:** Use of `window.open` without URL validation or `opener` isolation allowed potential XSS via `javascript:` URIs and reverse tabnabbing attacks where a malicious destination could control the parent window.
**Learning:** In modern browsers, `window.open(url, target, '')` (even with an empty features string) often forces a popup window instead of a new tab. To maintain the "open in new tab" UX, the features argument must be completely omitted.
**Prevention:** Use the centralized `safeOpen` utility which validates URLs against a strict protocol whitelist and explicitly nulls `win.opener` after opening, while preserving tab/window behavior based on the presence of optional features.
