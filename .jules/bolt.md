## 2026-06-11 - [Map-to-Array Anti-Pattern]
**Learning:** Converting a Map back to an array to perform linear searches with `.find()` negates all performance benefits of the Map and adds overhead for array construction. This is a common regression in this codebase's academic progress logic.
**Action:** Always use `Map.get()` for O(1) lookups. When refactoring, ensure that explicit type parameters (e.g., `new Map<string, AcademicChapter>(...)`) are used to satisfy `tsc`.

## 2026-06-11 - [O(N^2) Complexity in Component Hydration]
**Learning:** Using `Array.find` inside a `.map()` during `useEffect` hydration (e.g., in `SyllabusView.tsx`) creates O(N*M) complexity, leading to noticeable UI lag as the syllabus grows.
**Action:** Pre-build a lookup Map once at the start of the effect to reduce complexity to O(N+M).
