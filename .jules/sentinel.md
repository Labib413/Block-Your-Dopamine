## 2025-06-20 - Secure External Navigation and Input Validation
**Vulnerability:** Direct usage of `window.open` and unsanitized user-provided URLs allowed for Reverse Tabnabbing and potential client-side XSS via `javascript:` URIs.
**Learning:** External links opened without `noopener` can allow the destination page to manipulate the source page via `window.opener`. Additionally, treating any user-provided string as a valid URL for `window.open` or `<a>` tags without protocol validation is a common vector for XSS.
**Prevention:** Use a centralized `safeOpen` utility that ensures `noopener` is set and validates URLs against a strict whitelist of protocols (e.g., https, mailto) using an `isValidUrl` check.
