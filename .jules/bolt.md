## 2026-06-11 - Optimized Chapter Lookups in AppContext
**Learning:** Linear searches using `.find()` inside mapping functions or loops for academic chapters constitute a recurring O(N^2) performance bottleneck, especially as the syllabus dataset grows.
**Action:** Consistently use `Map` for O(1) lookups when iterating over or merging collections of academic data (chapters, subjects, routines) in `AppContext.tsx`.
