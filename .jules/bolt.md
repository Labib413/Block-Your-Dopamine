## 2025-05-15 - Optimized Syllabus Progress Calculation
**Learning:** The `calculateAllSubjectsProgress` function was using O(N) array searches inside a nested loop over subjects and chapters, leading to O(S * C) complexity. By converting the chapter array into a Map once, lookups become O(1), reducing total complexity to O(S + C).
**Action:** Use Map-based lookups when iterating over predefined structures (like syllabus) to match against state-driven data (like chapters) to avoid quadratic performance degradation as data grows.
