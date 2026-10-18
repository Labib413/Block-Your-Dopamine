# Bolt's Performance Journal

## 2025-05-15 - [O(N^2) Bottleneck in Academic Progress and Sync]
**Learning:** Linear searches using `.find()` inside mapping functions for academic chapters constitute a recurring O(N^2) performance bottleneck. Iterating over the HSC syllabus dataset (80+ chapters) results in significant overhead during both progress calculation and state hydration (sync).
**Action:** Consistently use Maps for lookups when iterating over the academic dataset to maintain O(N) complexity. Pre-create lookup Maps from arrays before entering loops.
