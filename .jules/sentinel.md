## 2025-02-12 - Centralized Security Utilities for URL Hardening
**Vulnerability:** Scattered use of `window.open` and unsanitized user-provided URLs in components like `SyllabusView`, `DistractionGuard`, and `FullscreenDetox`.
**Learning:** Hardcoding security checks in individual components leads to inconsistent protection and higher maintenance overhead. A centralized utility pattern ensures all external links and user inputs follow the same security protocol.
**Prevention:** Use `isValidUrl` and `safeOpen` utilities for all URL-related operations. These utilities should whitelist safe protocols (http, https, mailto, tel, blob), block `javascript:` and protocol-relative URLs, and enforce `noopener` with `opener = null` to prevent reverse tabnabbing.
