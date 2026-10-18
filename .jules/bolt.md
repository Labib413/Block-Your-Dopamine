## 2025-05-22 - [Optimized Syllabus Progress and Master Sync]
**Learning:** Replacing array '.find()' lookups with Map '.get()' in performance-critical loops significantly reduces computational complexity from O(N²) to O(N). Benchmark showed ~274ms to ~175ms for subject progress and ~153ms to ~50ms for masterSync merges.
**Action:** Always prefer Map lookups for datasets larger than 100 items when performing repetitive searches in a loop.
