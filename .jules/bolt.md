## 2026-06-11 - [Map-based Syllabus Lookups]
**Learning:** Linear searches using `.find()` inside mapping functions for academic chapters constitute a recurring O(N^2) performance bottleneck in this codebase's architecture. Even with relatively small datasets (80+ chapters), the cumulative impact on recalculations and synchronization is significant.
**Action:** Consistently use Maps for lookups when iterating over the HSC syllabus dataset or merging state updates to maintain O(N) complexity.
