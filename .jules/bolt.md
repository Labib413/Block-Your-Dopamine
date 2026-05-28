## 2025-05-15 - [Scoped Performance PRs]
**Learning:** Including unrelated TypeScript/lint fixes in a performance optimization PR leads to "over-reaching" scope creep and rejection by reviewers, even if the fixes are necessary for `npm run lint` to pass.
**Action:** Keep Bolt PRs strictly focused on ONE performance improvement. If linting fails due to pre-existing errors, document them in the PR description rather than fixing them in the same PR, unless they directly block the optimization.

## 2025-05-15 - [Map-based Lookup for Syllabus Progress]
**Learning:** The syllabus progress calculation was using O(N) `.find()` lookups inside nested loops, causing a significant performance bottleneck as the number of chapters increased.
**Action:** Always prefer Map-based O(1) lookups for entity-heavy state derivations (like syllabus progress or chapter hydration) to keep the UI responsive during state transitions.
