## 2025-05-14 - Map-based O(1) lookups for HSC syllabus processing

**Learning:** Linear searches using `.find()` inside mapping functions for academic chapters (O(N^2) complexity) constitute a recurring performance bottleneck in this codebase, especially when processing the large HSC syllabus dataset.

**Action:** Consistently use Map-based lookups when iterating over the HSC syllabus or merging chapter data to maintain O(N) complexity.
