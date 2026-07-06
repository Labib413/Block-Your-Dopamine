## 2025-05-15 - [O(N) Map-based Lookups]
**Learning:** Replacing O(N) linear searches (using `.find()`) inside loops with O(1) Map lookups provides a significant performance boost in state management and data merging, especially for datasets like the HSC syllabus (~80 chapters). A common anti-pattern was creating a Map for deduplication but immediately converting it back to an array, losing the O(1) benefit.
**Action:** Always prefer Map-based lookups when iterating over or merging structured datasets by ID. Avoid the "Map-to-Array-to-Find" pattern.
