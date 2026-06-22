## 2025-05-15 - [O(1) Map Lookups for Academic Syllabus]
**Learning:** Linear searches using `.find()` inside mapping functions for academic chapters constitute a recurring O(N^2) performance bottleneck. The "Map-to-Array" anti-pattern (creating a Map for deduplication but immediately converting it back to an array for linear searching) was also identified.
**Action:** Consistently use Maps for lookups when iterating over datasets with 80+ items. Use `for...of` loops for Map construction to avoid intermediate array allocations.

## 2025-05-15 - [API Surface & Benchmark Hygiene]
**Learning:** Temporarily exporting internal functions or committing benchmark scripts and lockfiles results in cluttered PRs and architectural regressions.
**Action:** Ensure all internal helpers or exports temporarily modified for benchmarking are reverted to their original visibility. Never commit `pnpm-lock.yaml`, `package-lock.json`, or temporary `benchmark_*.ts` files unless explicitly requested.
