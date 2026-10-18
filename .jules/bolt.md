# Bolt's Performance Journal

## 2025-05-15 - Map-to-Array Anti-pattern in State Hydration
**Learning:** Found a recurring pattern where data was being searched via `.find()` in O(N) complexity inside loops, resulting in O(N²) or O(S*C*N) bottlenecks. Specifically, `calculateAllSubjectsProgress` and `masterSync` in `AppContext.tsx` and the hydration logic in `SyllabusView.tsx` were suffering from this.

**Action:** Replace array-based searches with `Map` lookups (O(1)) whenever searching for items by ID inside a loop. Always establish a lookup map before entering the loop to ensure constant time complexity for each iteration.

## 2025-05-15 - Verification of Map Optimization
**Learning:** Replacing `.find()` with `Map.get()` in `calculateAllSubjectsProgress` yielded a ~8.7x speedup (328ms down to 37ms for 100 iterations on 1000 chapters).
**Action:** Use `Map` for deduplication and lookups when dealing with potentially large datasets like academic chapters.
