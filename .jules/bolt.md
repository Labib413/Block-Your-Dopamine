## 2026-06-08 - [O(1) Map Lookups for Academic Progress]
**Learning:** In a codebase with large datasets (e.g., thousands of academic chapters), nested linear searches (using `.find()` or `.some()` inside a `.map()` or `.forEach()`) create significant O(N^2) or O(N*M) bottlenecks. Replacing these with O(1) Map lookups provides a measurable performance boost.
**Action:** Always prefer Map-based lookups when reconciling or calculating progress across large item sets in AppContext.
