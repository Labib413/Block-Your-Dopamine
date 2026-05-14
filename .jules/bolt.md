## 2025-05-14 - Optimized Academic Hub data processing and date formatting
**Learning:** Re-instantiating `Intl.DateTimeFormat` in high-frequency functions is a significant performance bottleneck. Replacing `O(N)` array searches (like `.find()`) with `O(1)` Map lookups inside loops provides a measurable speedup for data-heavy operations like subject progress calculation and cloud data merging.
**Action:** Always prefer module-level constants for `Intl` formatters and use `Map` or indexed objects for lookups in performance-critical paths.
