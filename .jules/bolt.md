# Bolt's Journal - Critical Learnings

## 2025-05-15 - [Map-to-Array Anti-pattern in Progress Calculation]
**Learning:** A recurring performance bottleneck in this codebase is the "Map-to-Array" anti-pattern. Data is deduplicated into a Map using `new Map(chapters.map(c => [c.id, c]))`, but then immediately converted back to an array using `.values()` and `Array.from()` only to perform linear `.find()` lookups inside nested loops. In `calculateAllSubjectsProgress`, this resulted in O(S * C * C_subject) complexity where S is subjects and C is chapters.
**Action:** Always maintain the Map for O(1) lookups during iterations. Replacing `.find()` with `.get()` on a Map yielded an 8.42x speedup in benchmarks (2.87ms -> 0.34ms for 1000 chapters).
