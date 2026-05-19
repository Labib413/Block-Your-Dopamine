# Bolt's Performance Journal ⚡

## 2025-05-15 - Batching Supabase Sync Requests
**Learning:** The application uses a sync queue that processes items individually. During operations like a "Syllabus Reset", this triggers dozens of individual network requests, causing significant overhead and potential rate-limiting or network congestion. Supabase's `.upsert()` and `.insert()` methods natively support arrays, allowing O(N) operations to be batched into O(1) per table/operation type.
**Action:** Always prefer batched operations when processing queues or multiple related data points to minimize network round-trips.
