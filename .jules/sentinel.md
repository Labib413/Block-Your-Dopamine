## 2025-05-15 - Harden URL handling and prevent URI-based XSS
**Vulnerability:** Reverse tabnabbing and potential URI-based XSS (javascript: injection) via user-controlled avatar and badge icon URLs.
**Learning:** Even if URLs are partially validated (e.g. checking for existence), sophisticated bypasses like "java script:" (with whitespace) can still execute if using direct <img> tags or window.open without proper sanitization.
**Prevention:** Always use a central URL validator that strips whitespace and explicitly allowlists protocols. Use `noopener,noreferrer` for all external links and set `win.opener = null`.
