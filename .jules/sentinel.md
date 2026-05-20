## 2025-05-14 - Avatar URL Sanitization
**Vulnerability:** Potential XSS via `profile.avatarUrl` in `img` tag `src` attribute.
**Learning:** Even simple `img` tags can be dangerous if the `src` attribute is user-controlled and not validated. While standard browsers block most `javascript:` in `img src`, some older browsers or specific environments might still be vulnerable, and it's a best practice to sanitize URLs before rendering.
**Prevention:** Use a protocol whitelist (`http:`, `https:`, `blob:`, and safe `data:image/...`) to validate user-provided URLs before using them in sensitive attributes.

## 2025-05-14 - Weak Random ID Generation Fallback
**Vulnerability:** Use of `Math.random()` as a fallback for `crypto.randomUUID()` in `generateId`.
**Learning:** `Math.random()` is not cryptographically secure and can lead to predictable IDs, which can be exploited if those IDs are used for security-sensitive purposes (though here they are mostly UI keys, it's a bad pattern).
**Prevention:** Prioritize `crypto.randomUUID()`, then `crypto.getRandomValues()` for a manual UUID v4 implementation, and only use `Math.random()` as a last resort if high entropy is not strictly required.
