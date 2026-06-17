## 2026-06-17 - [Optimize chapter lookups using Map]
**Learning:** Nested array search (O(N)) inside loops leads to O(N^2) complexity, which is a significant bottleneck for progress calculation and data hydration. Using a Map for O(1) lookups provides measurable speedup (~1.44x for 80 chapters, scaling better with more data).
**Action:** Always prefer Map for frequent lookups within loops instead of `array.find()`. Ensure consistency in ID generation (e.g., using `stringToUUID`) when using them as Map keys.
