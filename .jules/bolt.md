## 2025-05-15 - Map-to-Array Anti-Pattern in State Merging
**Learning:** A recurring performance bottleneck in `AppContext.tsx` involves creating a Map for deduplication but immediately converting it back to an array for linear searching via `.find()`. In the HSC syllabus context (~80 chapters), this O(N^2) operation significantly slows down state hydration and progress calculation.
**Action:** Always maintain Map-based lookups when iterating over the syllabus dataset. When merging local and cloud state, pre-index both collections into Maps to ensure O(1) lookups during the mapping process.
