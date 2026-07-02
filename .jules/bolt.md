## 2026-07-02 - Map-based lookup optimization in AppContext

**Learning:** Iterating over the HSC syllabus and performing linear searches (.find()) for chapter state creates an O(N^2) bottleneck, especially noticeable during subject progress calculation and master sync merging.

**Action:** Consistently use Maps for chapter lookups when iterating over the syllabus to ensure O(1) access time and maintain high performance as the dataset grows.
