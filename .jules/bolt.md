
## 2026-06-09 - [Optimized Academic Progress Calculation]
**Learning:** Found a "Map-to-Array" anti-pattern where data was deduplicated using a Map but immediately converted back to an array for linear searches using `.find()`. This resulted in O(S * C * N) complexity instead of O(S * C).
**Action:** Retain the Map created for deduplication and use `.get()` for O(1) lookups inside nested loops.
