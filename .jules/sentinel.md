## 2025-05-14 - Reverse Tabnabbing and XSS via Malicious URI Schemes
**Vulnerability:** Use of unsanitized user-provided URLs in `window.open` and `img src` attributes.
**Learning:** Even internal-feeling features like "Distraction Guard" can be vectors for reverse tabnabbing (if `opener` isn't nullified) or `javascript:` URI injection if users can input their own resource links.
**Prevention:** Always use a centralized `safeOpen` utility that enforces `noopener,noreferrer` and validates the protocol with an `isValidUrl` check. Ensure the URL validation supports modern, long TLDs to avoid functional regressions.
