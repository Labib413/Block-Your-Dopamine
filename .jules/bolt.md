## 2025-05-15 - [Map-to-Array Performance Anti-pattern]
**Learning:** Found a recurring pattern where data was deduplicated using a Map (e.g. `Array.from(new Map(...).values())`) only to be immediately searched via `.find()` in a subsequent loop. This negates the performance benefits of the Map.
**Action:** Always maintain data in Map form when subsequent O(1) lookups are required, especially within loops iterating over related structural data (like the HSC syllabus).
