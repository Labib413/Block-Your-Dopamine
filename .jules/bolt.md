## 2026-06-29 - Optimized Chapter Progress Calculation
**Learning:** Linear searches using `.find()` inside mapping functions for academic chapters constitute a recurring O(N*M) performance bottleneck. Replacing this with a pre-computed Map reduces lookup complexity to O(1), significantly improving UI responsiveness when dealing with the HSC syllabus dataset.
**Action:** Consistently use Map-based lookups for O(1) efficiency when iterating over datasets like HSC chapters.
