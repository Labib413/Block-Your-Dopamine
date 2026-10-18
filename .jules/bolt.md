## 2025-05-15 - Optimize chapter lookup complexity in AppContext
**Learning:** Using Maps instead of array searches inside nested loops or frequent sync operations significantly reduces computational overhead, especially as the number of academic chapters grows (O(N^2) to O(N)).
**Action:** Always prefer Map-based lookups for ID-based data retrieval in core state management logic.
