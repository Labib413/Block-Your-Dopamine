## 2025-06-26 - Optimized Chapter Lookups with Maps
**Learning:** Linear searches using `.find()` inside mapping functions or loops constitute a recurring O(N^2) performance bottleneck, especially when dealing with the HSC syllabus dataset (80+ chapters). Using Maps for O(1) lookups provides measurable speedups (~1.4x-1.5x for progress calculation).
**Action:** Consistently use Maps for lookups when iterating over subjects or chapters. Avoid the Map-to-Array anti-pattern (creating a Map for deduplication but immediately converting it back to an array for linear searching).
