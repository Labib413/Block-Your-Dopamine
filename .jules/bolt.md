## 2026-06-11 - Optimized Chapter Lookups
**Learning:** Found quadratic complexity O(N^2) bottlenecks in AppContext.tsx and SyllabusView.tsx due to linear finds in loops over academic chapters.
**Action:** Replace linear searches with Map lookups to achieve O(1) complexity per chapter. Always use explicit type parameters for Maps to maintain TypeScript compliance during project builds.
