## 2025-05-24 - [Optimized Syllabus Progress Calculation]
**Learning:** Found a performance bottleneck in `calculateAllSubjectsProgress` where a nested loop was performing an O(N) array search (`find`) for every chapter across all subjects. This resulted in O(S * C * N) complexity, which is practically O(N²) for this use case.
**Action:** Replaced the array scan with a `Map` lookup. This reduced the complexity to O(N), resulting in a ~35% speedup in benchmarked iterations (from ~3.0s to ~2.0s for 10,000 iterations). Always use Map lookups for ID-based searches in loops.
