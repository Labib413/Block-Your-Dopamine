# Bolt's Journal ⚡

## 2025-05-14 - [O(N^2) Array Search in Progress Calculation]
**Learning:** The `calculateAllSubjectsProgress` function was performing $O(N)$ array searches (`.find()`) inside a nested loop over subjects and chapters, leading to $O(N^2)$ complexity. This was particularly noticeable when the chapter list grew (e.g., 1600+ chapters in simulation). Switching to a `Map` for lookups reduced the execution time by ~64% (from ~1.04ms to ~0.4ms in local benchmarks).
**Action:** Always prefer `Map` or `Set` for frequent lookups within loops, especially when dealing with entities that have unique IDs.

## 2025-05-14 - [Inefficient Cloud-Local State Merging]
**Learning:** The `masterSync` function had similar $O(N^2)$ bottlenecks when merging default, cloud, and local chapter states. By pre-indexing these arrays into Maps, we ensure the UI remains responsive during background synchronization.
**Action:** Apply pre-indexing patterns to all synchronization logic that involves merging large data sets.
