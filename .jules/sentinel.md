## 2026-06-27 - Securing External Navigation and Resource Entry
**Vulnerability:** Cross-Site Scripting (XSS) via 'javascript:' URIs and Reverse Tabnabbing via insecure 'window.open' calls.
**Learning:** The application allowed users to input arbitrary URLs for resources and opened external links without 'noopener' or clearing 'window.opener', exposing users to script execution and tab hijacking.
**Prevention:** Always validate user-provided URLs against a protocol whitelist (rejecting 'javascript:') and use a centralized 'safeOpen' utility that enforces 'noopener' and 'opener = null' for all external navigation.
