## 2025-05-21 - O(N²) Chapter Lookups in Progress Calculation
**Learning:** Using `Array.find()` inside loops for chapter lookups in `calculateAllSubjectsProgress` and `masterSync` created a significant performance bottleneck as the syllabus size grew. Map-based lookups reduced execution time from ~1600ms to ~6ms for 10,000 items.
**Action:** Always prefer `Map` or `Record` for lookups by ID when iterating over large datasets or performing state merges.

## 2025-05-21 - Batched Supabase Operations
**Learning:** Serial or unbatched concurrent requests in `processSyncQueue` caused high network overhead and potential race conditions during bulk updates (like syllabus resets).
**Action:** Group sync items by table and operation type to leverage Supabase/PostgREST batched operations (`.upsert([...])`).
