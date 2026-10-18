## 2025-05-15 - Optimization of chapter processing lookups
**Learning:** Replacing array `.find()` with `Map.get()` inside high-frequency loops (like syllabus calculations and state merges) yielded a ~5x performance improvement in benchmarks.
**Action:** Always prefer Map lookups for ID-based data retrieval when processing large collections in AppContext.
