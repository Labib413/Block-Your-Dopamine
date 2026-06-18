## 2026-05-13 - Tabnabbing vs Window Reference Tracking
**Vulnerability:** Reverse Tabnabbing (via `window.opener` access) vs broken window management logic.
**Learning:** Using `noopener` in `window.open` features string causes the function to return `null` in modern browsers. This breaks any application logic that relies on the returned window reference to track the state of the opened window (e.g., checking if `win.closed` is true).
**Prevention:** If window tracking is required, avoid `noopener`. Instead, explicitly set `win.opener = null` after opening, although this may not be fully equivalent to `noopener` in all security aspects. If tracking is NOT required, always use `noopener,noreferrer`.
