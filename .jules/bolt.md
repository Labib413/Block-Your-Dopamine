## 2025-05-14 - [O(N^2) Bottleneck in Academic Progress Calculation]
**Learning:** Linear searches using `.find()` inside mapping functions for academic chapters (80+ chapters across 9 subjects) constitute a recurring O(N^2) performance bottleneck during state hydration and progress calculation.
**Action:** Consistently use `Map` for chapter lookups in `AppContext.tsx` and related syllabus views to ensure O(1) efficiency.
