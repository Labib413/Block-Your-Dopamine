## 2025-05-15 - Optimize Subject Progress Calculation
**Learning:** Linear searches using `.find()` inside mapping functions (like `subjects.map(...)`) when iterating over the HSC syllabus dataset (80+ chapters) constitute a recurring O(N^2) performance bottleneck.
**Action:** Consistently use Maps for O(1) lookups. Build the Map once outside the loop and avoid the 'Map-to-Array' anti-pattern (converting Map back to Array just to use `.find()`).
