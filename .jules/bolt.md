# Bolt's Journal - Performance Optimizations

## 2025-05-15 - Initial Audit: AppContext Bottlenecks
**Learning:** Found O(N²) complexity in `calculateAllSubjectsProgress` and `masterSync` due to nested loops and `.find()` calls on large arrays (academic chapters). Additionally, `processSyncQueue` performs individual Supabase requests for each item, leading to network congestion during bulk syncs.
**Action:** Replace array searches with Map lookups (O(1)) and implement batching for Supabase operations in `processSyncQueue`.
