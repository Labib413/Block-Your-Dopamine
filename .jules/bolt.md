# Bolt's Journal - Critical Learnings

## 2025-05-15 - [O(N^2) Bottleneck in State Synchronization]
**Learning:** The application's syllabus progress calculation and master sync logic were using `.find()` inside loops over large datasets (chapters). With approximately 100+ chapters in the HSC syllabus, this resulted in $O(N^2)$ complexity, leading to noticeable UI lag during synchronization.
**Action:** Replace array `.find()` lookups with `Map`-based lookups for $O(1)$ constant time access.
