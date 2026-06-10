## 2026-06-10 - Map-to-Array Anti-pattern in Progress Calculation
**Learning:** A recurring performance anti-pattern in this codebase involves creating a `Map` for deduplication but immediately converting it back to an `Array` for linear searches via `.find()`. This negates the performance benefits of using a `Map`.
**Action:** When deduplicating or preparing lookups, maintain the data as a `Map` and use `.get()` or `.has()` for O(1) complexity instead of converting back to an array for linear searches.
