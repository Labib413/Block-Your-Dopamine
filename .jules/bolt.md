## 2025-05-15 - [Map-based lookup optimization]
**Learning:** Replacing array-based searches (O(N)) with Map-based lookups (O(1)) in core calculation logic provides a significant performance boost in data-heavy React applications, especially when these calculations are triggered frequently by state changes or synchronization.
**Action:** Always prefer Map or Record lookups for structural data merging or progress calculations when the number of items exceeds a trivial amount.

## 2025-05-15 - [Network Request Batching]
**Learning:** Supabase (and many REST APIs) perform much better when multiple operations are batched into a single request. Grouping sync queue items by table and operation type can reduce network overhead by orders of magnitude during bulk operations like syllabus resets.
**Action:** Implement batching for synchronization logic whenever multiple related updates are expected to occur simultaneously.
