## 2025-05-14 - Map-based lookup optimization for academic progress
**Learning:** Found a recurring O(N*M) anti-pattern where `.find()` was used inside loops to map syllabus chapters to their state. Replacing this with a Map lookup (`.get()`) significantly reduces the overhead as the syllabus size grows.
**Action:** Always prefer Map-based lookups when reconciling two datasets (e.g., structural syllabus vs. user progress state) in high-frequency functions or initialization hooks.

## 2025-05-14 - Map-to-Array anti-pattern in state updates
**Learning:** The codebase often deduplicated data into a Map only to immediately convert it back to an array for linear searching or mapping in the same scope.
**Action:** Keep data in Map format as long as possible for O(1) operations, and only convert to Array at the final step for state persistence or rendering.
