## 2025-05-14 - Optimized Dashboard Chart Data Aggregation
**Learning:** Found an (N \cdot M)$ complexity bottleneck in the Dashboard's chart data aggregation where $ is the historical record count and $ is the number of chart points. As the user's history grows, this leads to perceptible UI lag.
**Action:** Replaced (N)$ `.find()` operations within loops with (1)$ Map lookups. This pattern should be applied whenever aggregating historical logs into time-series data for charts.
