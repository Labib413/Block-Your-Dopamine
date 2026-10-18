## 2025-05-14 - Map-based O(1) Lookups in AppContext
**Learning:** Nested linear searches using `.find()` inside mapping functions for large datasets (like the HSC syllabus chapters) create (N^2)$ bottlenecks. Even when a Map is used for deduplication, converting it back to an array for searching negates the performance benefit.
**Action:** Always maintain and use Maps for O(1) lookups when iterating over or merging entity-based datasets. Use memory-efficient `for...of` loops to populate Maps to avoid intermediate array allocations.
