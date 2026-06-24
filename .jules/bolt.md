
## 2025-05-22 - Optimized Academic Progress Calculation
**Learning:** Using `.find()` inside a `.map()` loop over large datasets (HSC syllabus) creates an O(N^2) bottleneck. Maps are essential for O(1) lookups in high-frequency calculation paths like `calculateAllSubjectsProgress` and `masterSync`.
**Action:** Always prefer Map-based lookups when iterating over syllabus chapters or merging cloud data with local state.
