## 2025-05-22 - Optimized academic progress calculation and initialization

**Learning:** Replacing nested array searches ((N \cdot M)$) with Map-based lookups ((N+M)$) provides a measurable performance boost in core state calculation logic. Reusing computed values during state initialization prevents redundant execution of heavy generation functions.

**Action:** Always prefer Map lookups for frequently accessed ID-based data in large collections. Ensure state initializers are efficient by avoiding duplicate work.
