## 2026-05-24 - Map-based lookups for chapter calculations
**Learning:** The application performs redundant O(N) array searches within nested loops when calculating subject progress and merging cloud data. For datasets with hundreds of chapters, this results in O(N^2) complexity, leading to measurable UI lag during sync or state updates.
**Action:** Use Map-based lookups (O(1)) instead of array searches (O(N)) when dealing with large datasets in nested loops or frequent state updates.
