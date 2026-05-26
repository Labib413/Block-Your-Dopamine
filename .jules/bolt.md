## 2024-05-17 - O(n^2) nested loop in Syllabus progress calculation
**Learning:** The 'calculateAllSubjectsProgress' function in 'AppContext.tsx' was using '.find()' inside a nested loop over the syllabus structure (~90 chapters across 9 subjects). This resulted in O(N*M) complexity which ran on every state update and sync.
**Action:** Use a Map for O(1) lookups when iterating over predefined structures (like HSC_SYLLABUS) against state arrays (like academicChapters). Pre-indexing into a Map yielded a ~1.46x speedup in this specific bottleneck.

## 2024-05-17 - O(n^2) in masterSync chapter merge
**Learning:** During sync, 'masterSync' was merging cloud data into local state using multiple '.find()' calls inside a '.map()' loop over 90+ chapters.
**Action:** Pre-index 'cloudChapters' and 'prev.academicChapters' into Maps before the merge loop to keep the operation linear O(N+M) instead of quadratic O(N*M).
