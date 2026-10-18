## 2025-05-15 - Linear Search Bottleneck in Syllabus Progress
**Learning:** Performing linear searches with `.find()` inside a mapping loop over the HSC syllabus (80+ chapters) creates a measurable performance bottleneck ($O(N^2)$). Replacing these with Map-based lookups consistently improves execution time for progress calculation and state synchronization by ~30-40%.
**Action:** Always prefer Map-based lookups for chapter-specific operations in `AppContext.tsx` and related syllabus views.
