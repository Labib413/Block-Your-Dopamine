## 2026-06-30 - [Optimized Chapter Lookups]
**Learning:** Performing linear searches with `.find()` inside mapping functions for the HSC syllabus dataset (~80+ chapters) creates an O(N^2) bottleneck. Replacing these with O(1) Map lookups significantly reduces execution time.
**Action:** Always pre-calculate Maps for lookups when iterating over syllabus data or merging cloud/local state.
