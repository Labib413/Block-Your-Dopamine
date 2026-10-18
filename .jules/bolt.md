## 2026-07-06 - Linear Search Bottleneck in HSC Syllabus processing
**Learning:** Linear searches using `.find()` inside mapping functions for academic chapters (O(N^2) overall) constitute a significant performance bottleneck, especially when processing the large HSC syllabus dataset. Using Maps for O(1) lookups reduces execution time by ~32-36%.
**Action:** Consistently use Maps for lookups when iterating over the HSC syllabus or any large collection of keyed data in `AppContext.tsx`.
