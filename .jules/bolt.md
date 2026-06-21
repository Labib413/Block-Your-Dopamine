## 2026-06-11 - Map-based Academic Chapter Lookups
**Learning:** Linear searches using `.find()` inside mapping functions for academic chapters constitute a recurring O(N^2) performance bottleneck; consistently use Maps for lookups when iterating over the HSC syllabus dataset (80+ chapters).
**Action:** Always convert large arrays to Maps before performing repeated lookups within loops or mapping functions.
