## 2025-05-15 - Linear Search Bottleneck in HSC Syllabus Dataset

**Learning:** Linear searches using `.find()` inside mapping functions for academic chapters constitute a recurring O(N^2) performance bottleneck when dealing with the HSC syllabus dataset (~80 chapters across 9 subjects).

**Action:** Consistently use Maps for O(1) lookups when iterating over the HSC syllabus dataset in core state logic and view hydration.

## 2025-05-15 - Map Creation Optimization

**Learning:** Creating a Map for deduplication but immediately converting it back to an array for linear searching via `.find()` is a "Map-to-Array" anti-pattern that negates the performance benefits of using a Map.

**Action:** Maintain the Map as the primary lookup structure throughout the iteration logic to ensure O(1) efficiency. For memory-efficient Map creation from large arrays, use a `for...of` loop with `map.set()` instead of the `new Map(array.map(...))` constructor pattern to avoid intermediate array allocations.
