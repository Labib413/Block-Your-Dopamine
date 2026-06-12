
## 2026-06-11 - Map-to-Array and Single-Lookup Map Anti-patterns
**Learning:** Replacing a nested O(N) '.find()' with a pre-built Map significantly improves performance (2.3x to 21x speedup depending on size). However, creating a Map for a **single** lookup is an anti-pattern as Map construction (O(N)) has higher constant overhead and memory allocation than a simple linear scan for one item.
**Action:** Use Maps for multiple lookups within loops; stick to '.find()' for isolated single lookups.
