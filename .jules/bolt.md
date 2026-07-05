## 2026-07-05 - O(N) lookup bottleneck in AppContext
**Learning:** In contexts where large datasets (like the HSC syllabus) are frequently iterated over (progress calculation, cloud state merging), using `.find()` inside a `.map()` or `.forEach()` creates an O(N^2) performance bottleneck. This was particularly evident in `calculateAllSubjectsProgress` and `masterSync` logic.
**Action:** Always pre-convert lookup arrays into Maps for O(1) access when processing datasets within loops.
