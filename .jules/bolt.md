## 2025-06-27 - O(N^2) Bottleneck in Syllabus Progress Calculation
**Learning:** Linear searches using `.find()` inside mapping functions for academic chapters constitute a recurring O(N^2) performance bottleneck, especially when iterating over the HSC syllabus dataset (80+ chapters). Replacing these with Map-based lookups provides a measurable speedup (~33% in benchmarks).
**Action:** Consistently use Maps for O(1) lookups when correlating items between datasets like the syllabus and user chapter state.
