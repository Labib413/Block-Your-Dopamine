## 2026-06-13 - [Map-to-Array Anti-pattern]
**Learning:** Found O(N) array finds using `.find()` inside loops that iterate over other O(M) structures, leading to O(N*M) complexity. Also identified the "Map-to-Array" anti-pattern where a Map is used for deduplication but then immediately converted back to an array for linear searching.
**Action:** Always prefer Map `.get()` for O(1) lookups inside loops or when multiple lookups are performed against the same dataset.
