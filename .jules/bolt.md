## 2026-05-31 - [Optimization of Academic Data Lookups]
**Learning:** Linear lookups using '.find()' inside nested loops or frequently triggered hooks (like hydration or progress calculation) create O(N^2) bottlenecks as the dataset grows. In this codebase, 'AcademicChapters' can grow significantly, making these lookups expensive.
**Action:** Always prefer 'Map' for lookups by ID when dealing with collections that are iterated over or accessed frequently. This reduces complexity to O(N) overall.
