## 2025-05-15 - Map Lookups in AppContext
**Learning:** Linear searches using `.find()` inside high-frequency functions (like `calculateAllSubjectsProgress`) or complex synchronization loops (like `masterSync`) create $O(N^2)$ performance bottlenecks when dealing with the HSC syllabus dataset (~80-100 chapters across multiple subjects). Converting arrays to Maps for $O(1)$ lookups significantly reduces execution time.

**Action:** Consistently use Map-based lookups when iterating over or merging academic chapter datasets in `AppContext.tsx` and related views. Avoid the "Map-to-Array" anti-pattern (creating a Map for deduplication but immediately converting it back to an array for linear searching).
