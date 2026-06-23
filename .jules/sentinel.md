## 2026-06-23 - [Centralized Secure URL Handling]
**Vulnerability:** Scattered `window.open` calls without `noopener` and unvalidated user input in `prompt()` creating XSS and reverse tabnabbing risks.
**Learning:** In a large React codebase, security utilities must be centralized in `utils.ts` and exported to ensure consistency across complex components like `FullscreenDetox`.
**Prevention:** Always use a `safeOpen` wrapper for external navigation and `isValidUrl` for any user-provided string that will be used as a link or iframe source.
