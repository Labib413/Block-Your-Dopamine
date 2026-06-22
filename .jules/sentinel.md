## 2025-05-15 - [Securing External Navigation and URL Inputs]
**Vulnerability:** The application allowed user-provided URLs in `prompt()` and `input` fields to be used directly in `window.open()` or as resource links without validation, exposing users to XSS via `javascript:` URIs and Reverse Tabnabbing.
**Learning:** Even internal productivity tools are susceptible to simple injection and navigation attacks if user input is trusted. Centralizing URL validation and navigation helpers ensures consistent security across components.
**Prevention:** Always use a whitelist-based URL validator (like `isValidUrl`) for any user-provided links and a secure wrapper for `window.open` (like `safeOpen`) that enforces `noopener` and `noreferrer`.
