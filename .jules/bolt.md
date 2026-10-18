## 2026-06-20 - [Fix O(N^2) Regression in Syllabus Calculation]
**Learning:** Linear searches using `.find()` inside mapping functions for academic chapters constitute a recurring O(N^2) performance bottleneck. Despite previous optimizations, these anti-patterns re-emerged in `calculateAllSubjectsProgress` and `masterSync`. Using a `Map` for O(1) lookups is essential when dealing with the HSC syllabus dataset (approx. 90 chapters).
**Action:** Always use Map-based lookups when iterating over the HSC syllabus chapters. Verify speedups using `benchmark_performance.ts`.
