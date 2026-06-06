## 2026-06-06 - [Map Lookup Optimization]
**Learning:** Replaced nested linear .find() lookups with O(1) Map lookups in core data processing functions. In hydration logic with ~1000 chapters, this yielded a ~10x speedup in local benchmarks.
**Action:** Always prefer pre-computing a Map for lookups when iterating over large datasets or performing frequent state updates involving ID-based searches.
