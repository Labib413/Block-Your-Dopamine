## 2026-06-11 - [Map-based Indexing for Academic Chapters]
**Learning:** The codebase previously used an $O(N^2)$ pattern where academic chapters were looked up via `.find()` inside of loops across multiple functions in `AppContext.tsx` and `SyllabusView.tsx`. This led to measurable performance degradation as the number of chapters grew.
**Action:** Always prefer indexing large collections into a `Map` before performing lookups inside loops to achieve $O(N)$ complexity instead of $O(N^2)$.
