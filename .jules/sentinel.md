## 2025-05-15 - URL Validation and Secure Window Opening
**Vulnerability:** Reverse tabnabbing and potential XSS via unsanitized URLs in `window.open` and `img` tags.
**Learning:** The application allows users to input external URLs for resources and avatar profiles without strict validation. This can lead to security risks if malicious URLs (like `javascript:`) are provided.
**Prevention:** Always validate user-provided URLs against safe protocols (http, https, blob, data:image) and use secure window opening techniques (`noopener,noreferrer` and `opener = null`).
