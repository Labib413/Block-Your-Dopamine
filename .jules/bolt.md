## 2026-06-11 - [O(1) Map Lookups for Chapters]
**Learning:** Found O(N^2) complexity patterns where chapter arrays were searched linearly inside loops during progress calculation, state merging, and component hydration. Replacing these with Map-based lookups significantly improves performance, especially as the number of chapters grows.
**Action:** Always prefer Map for ID-based lookups when iterating over large datasets or within frequent render cycles.
