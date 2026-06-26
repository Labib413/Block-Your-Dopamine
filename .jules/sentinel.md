## 2025-05-14 - URL Validation Logic and Non-Web Protocols
**Vulnerability:** XSS and Broken Functionality.
**Learning:** URL validation using only 'https://' prefixing and hostname checks breaks legitimate non-web protocols like 'mailto:', 'tel:', and 'blob:'.
**Prevention:** Whitelist safe protocols and skip structural hostname checks for non-http/https URIs while maintaining strict 'javascript:' blocking.

## 2025-05-14 - Reverse Tabnabbing in Named Windows
**Vulnerability:** Reverse Tabnabbing (Security Bypass).
**Learning:** Target-specific security logic (e.g., only checking '_blank') misses vulnerabilities in named windows which still allow 'window.opener' access.
**Prevention:** Apply 'noopener' and 'opener = null' to all external navigation targets that are not '_self'.
