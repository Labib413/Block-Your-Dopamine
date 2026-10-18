## 2025-06-12 - [Map-to-Array Anti-Pattern]
**Learning:** A recurring performance regression was identified where a Map is used for deduplication but immediately converted back to an array for linear searching via `.find()`. This negates the O(1) lookup benefits of the Map and leads to O(N^2) complexity in loops.
**Action:** Always maintain data in Map format if multiple lookups are required against the same dataset. Avoid `Array.from(map.values()).find(...)` in hot paths.
