
## 2026-05-22 - [O(N) search in progress calculation]
**Learning:** The `calculateAllSubjectsProgress` function was performing an O(N) `.find()` inside a nested loop over subjects and chapters, leading to O(S * C * N) complexity.
**Action:** Replace array `.find()` with Map-based O(1) lookups in performance-critical calculation loops.
