## 2025-05-15 - Map-based O(1) Lookups for Chapter Data
**Learning:** Linear searches using `.find()` inside mapping functions for academic chapters (e.g., during progress calculation or state hydration) constitute a recurring O(N^2) performance bottleneck when processing the HSC syllabus dataset.
**Action:** Consistently use Maps for O(1) lookups instead of linear searches when iterating over large datasets or performing frequent updates in `AppContext.tsx` and related components.
