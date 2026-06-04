## 2025-05-15 - Reverse Tabnabbing and XSS via javascript: URIs
**Vulnerability:** Use of window.open() without noopener/noreferrer and lack of validation on user-provided URLs in <img> tags.
**Learning:** window.open() allows the new page to access window.opener, enabling phishing via tabnabbing. javascript: URIs in src attributes or window.open() allow arbitrary code execution.
**Prevention:** Use a secure wrapper like safeOpen() that enforces noopener,noreferrer and validates URLs against a protocol whitelist (http, https, mailto, tel, blob, and safe data:image types).
