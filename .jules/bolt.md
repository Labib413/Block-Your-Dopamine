## 2026-05-31 - [O(1) Map Lookups for Syllabus Calculations]
**Learning:** The codebase previously deduplicated chapters into a Map only to immediately convert them back to an array for linear searches using `.find()` inside nested loops. This resulted in O(N²) complexity for core syllabus progress calculations and synchronization merging.
**Action:** Always maintain data in Map structures when performing lookups against large datasets in React Context handlers. Avoid converting Maps back to arrays if the next operation is a search.
