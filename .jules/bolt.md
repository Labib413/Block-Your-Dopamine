## 2025-05-14 - Map-to-Array Anti-pattern in State Calculations

**Learning:** This codebase frequently used a pattern where data was deduplicated into a `Map`, but then immediately converted back into an `Array` using `Array.from(map.values())`, only to perform linear `.find()` lookups on that array inside a nested loop. This transformed what should be $O(N)$ operations into $O(N^2)$, causing significant performance degradation as the dataset grew (e.g., 1000+ chapters).

**Action:** Always check if a Map created for deduplication can be used directly for lookups. If multiple lookups are needed inside a loop, pre-calculate Maps for all source arrays before entering the loop to ensure O(1) access time.
