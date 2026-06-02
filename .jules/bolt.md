## 2024-05-22 - Map-based lookup optimization in AppContext
**Learning:** In the progress calculation logic, using `Array.find()` inside a loop over the entire syllabus resulted in O(N*M) complexity. Even with relatively small syllabus sizes, this pattern scales poorly and causes UI lag during frequent state updates.
**Action:** Always prefer Map-based lookups for chapter/subject indexing in core context logic to ensure O(1) retrieval.
