
## 2026-06-17 - [O(1) Map Lookup for Chapter Progress]
**Learning:** The Map-to-Array anti-pattern (creating a Map for deduplication but immediately converting it back to an array for linear searching via `.find()`) was causing O(N^2) complexity in `calculateAllSubjectsProgress`.
**Action:** Always prefer direct O(1) Map lookups for datasets requiring multiple searches. Use `for...of` loops for population to avoid intermediate array overhead from `.map()`.
