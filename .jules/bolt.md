## 2025-05-22 - [Map-based O(1) lookups for HSC Syllabus]
**Learning:** Linear searches using `.find()` inside mapping functions for academic chapters (O(N^2)) constitute a recurring performance bottleneck in state hydration and progress calculation.
**Action:** Consistently use `Map` for O(1) lookups when iterating over the HSC syllabus dataset to ensure O(N) complexity for state merges and progress calculations.
