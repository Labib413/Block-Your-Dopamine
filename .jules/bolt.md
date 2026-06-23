## 2025-05-15 - [O(N^2) Syllabus Progress Bottleneck]
**Learning:** The application repeatedly calculates progress for all academic subjects by iterating over the entire HSC syllabus (~80+ chapters) and performing a linear `.find()` for each chapter within a nested mapping loop. This results in O(N^2) complexity where N is the number of chapters.
**Action:** Consistently use Map-based lookups (O(1)) instead of linear searches when processing large datasets like the HSC syllabus, especially within `calculateAllSubjectsProgress` and state merging logic in `masterSync`.
