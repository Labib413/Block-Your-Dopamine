## 2025-05-15 - [Map Lookup Optimization]
**Learning:** Found an O(N^2) anti-pattern where an array was being searched with `.find()` inside a loop. Even worse, in some places, a Map was created for de-duplication but then immediately converted back to an array for linear searching.
**Action:** Use Map.get() for O(1) lookups whenever searching for items by ID in a loop, especially in hydration and progress calculation logic.
