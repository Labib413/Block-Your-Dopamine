## 2025-05-15 - Optimize chapter lookups in AppContext
**Learning:** Found O(N²) bottlenecks in `calculateAllSubjectsProgress`, `updateChapterProgress`, and `masterSync` where array `.find()` was called inside loops. Replacing these with `Map` lookups significantly improves performance for users with many chapters.
**Action:** Always prefer `Map` for ID-based lookups inside loops when dealing with large collections like academic chapters.
