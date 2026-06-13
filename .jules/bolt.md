## 2025-05-15 - Optimized Academic Chapter Lookups
**Learning:** Found O(N^2) bottlenecks in academic progress calculation and master synchronization where Array.find was used inside loops. Replacing these with Map lookups yielded ~5x speedup in benchmarks.
**Action:** Always prefer Map for lookups by ID when operating on large datasets in loops.
