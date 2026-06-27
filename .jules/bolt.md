## 2025-05-22 - O(N^2) Lookup Bottlenecks in Academic Chapter Processing
**Learning:** Linear searches using `.find()` inside mapping functions for academic chapters (80+ chapters) across multiple subjects constitute a recurring O(N^2) performance bottleneck during state calculations and component hydration.
**Action:** Consistently use Maps for O(1) lookups when iterating over the HSC syllabus dataset in `AppContext` and related View components.
