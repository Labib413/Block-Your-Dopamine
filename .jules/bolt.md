## 2026-06-24 - [Optimize syllabus progress and sync logic]
**Learning:** Linear searches using `.find()` inside mapping functions for academic chapters (HSC syllabus dataset with 80+ chapters) create O(N^2) bottlenecks during state hydration, progress calculation, and rendering.
**Action:** Consistently use Maps for O(1) lookups when iterating over the chapter dataset to maintain 60fps UI performance.
