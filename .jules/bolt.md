## 2025-05-15 - [Optimization of Progress Calculation and Date Formatting]
**Learning:** Hoisting `Intl.DateTimeFormat` outside of frequently called functions significantly reduces instantiation overhead. In the `calculateAllSubjectsProgress` function, replacing a nested `.find()` call with a `Map` lookup reduced the complexity from O(S * N * C) to O(C + S * N), resulting in a ~3x speedup in benchmarks.
**Action:** Always prefer Map lookups for searching in large datasets within loops, and hoist expensive objects like Intl formatters or regex patterns to the module level.
