## 2025-05-15 - O(N^2) Bottlenecks in Syllabus Progress and Merging
**Learning:** Iterating over the HSC syllabus dataset (which can grow with many chapters) and performing linear searches (.find()) inside mapping functions leads to O(N^2) performance bottlenecks. This was observed in 'calculateAllSubjectsProgress', 'masterSync', and component hydration.
**Action:** Always prefer Map-based lookups for O(1) efficiency when correlating data across collections, especially when dealing with the core academic dataset.
