## 2025-05-15 - Optimize Chapter Lookups with Maps
**Learning:** Replacing O(N) array `.find()` calls with O(1) Map `.get()` lookups in hot paths (like progress calculation and data merging) significantly reduces CPU overhead and UI jank.
**Action:** Always prefer Map-based lookups when iterating over a collection and searching in another large collection.

**Benchmark Results (1000 chapters, 100 iterations):**
- Old implementation: ~102ms
- New implementation: ~25ms
- Impact: ~4x performance improvement in core calculation logic.
