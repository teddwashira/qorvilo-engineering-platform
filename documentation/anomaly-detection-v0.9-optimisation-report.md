# QORVILO Anomaly Detection v0.9 — Optimisation Report

**Project:** QORVILO AI Personal Finance Platform  
**Version:** 0.9  
**Date:** 25 November 2026  
**Status:** Completed

## 1. Objective

The objective of v0.9 was to improve the execution performance of QORVILO's anomaly detection engine while preserving the existing detection rules and risk-scoring behaviour.

The v0.8 benchmark identified significant performance limitations at larger transaction volumes, particularly when processing 10,000 transactions.

## 2. Identified performance bottlenecks

The original implementation contained several computationally expensive operations:

1. Repeatedly filtering the complete expense history for every transaction.
2. Repeatedly sorting historical expense amounts to calculate medians.
3. Repeatedly filtering transactions by category when calculating monthly spending.
4. Processing historical data multiple times unnecessarily.

These operations contributed to increasing execution time as transaction volume grew.

## 3. Optimisation techniques

The following changes were implemented:

### 3.1 Historical median optimisation

Introduced two heaps to maintain historical expense medians.

- A max heap stores the lower half of historical values.
- A min heap stores the upper half.
- The median can be retrieved without sorting the complete historical dataset for every transaction.

### 3.2 Category grouping

Transactions are grouped by category and date before large-expense analysis.

This reduces repeated searches through the full expense list.

### 3.3 Monthly aggregation

Monthly spending totals are calculated using nested JavaScript Maps.

This avoids repeatedly filtering transactions for each category and month.

### 3.4 Duplicate detection

The existing Map-based duplicate lookup was retained.

## 4. Regression testing

The optimised implementation was tested using the existing JavaScript automated test suite.

| Test result | Count |
|---|---:|
| Total tests | 33 |
| Passed | 33 |
| Failed | 0 |
| Skipped | 0 |

**Regression test pass rate: 100%.**

The tests covered large expenses, spending spikes, duplicate detection, risk scores, invalid data, historical safeguards and date boundaries.

## 5. Performance benchmark results

The same benchmark script and synthetic dataset sizes were used before and after optimisation.

| Transactions | Before (ms) | After (ms) | Speed improvement |
|---:|---:|---:|---:|
| 100 | 0.4864 | 0.3257 | 1.49× |
| 1,000 | 22.4361 | 2.1863 | 10.26× |
| 5,000 | 511.7131 | 11.5326 | 44.37× |
| 10,000 | 2,065.2123 | 22.0409 | 93.70× |

At 10,000 transactions, execution time decreased from approximately 2.07 seconds to 22.04 milliseconds.

This represents an approximately 98.93% reduction in execution time.

## 6. Interpretation

The results demonstrate a substantial improvement in the measured performance of the anomaly detection function.

The improvement becomes more pronounced at larger transaction volumes.

The optimised implementation reduces repeated historical processing by using more efficient data structures and pre-grouped transaction data.

## 7. Limitations

1. The benchmark uses synthetic transaction data.
2. Measurements were collected in a Node.js environment, not through the complete browser application.
3. The 10,000-transaction benchmark used one measured execution after warm-up.
4. Hardware specifications and Node.js version were not recorded.
5. Memory usage was not measured.
6. The results do not establish production performance under concurrent users or real financial workloads.
7. Regression tests establish correctness only for the scenarios covered by the test suite.

## 8. Future work

Further engineering work should investigate:

- Memory consumption under large transaction volumes.
- Additional randomised regression testing.
- Direct browser performance measurements.
- Performance across different hardware configurations.
- Larger transaction datasets.
- More extensive edge-case testing.

## 9. Conclusion

QORVILO v0.9 successfully improved the measured performance of the anomaly detection engine.

The 10,000-transaction benchmark improved from 2,065.21 milliseconds to 22.04 milliseconds, representing a 93.70× speed improvement.

All 33 existing JavaScript regression tests passed after the optimisation.

The experiment demonstrates the value of profiling, selecting appropriate data structures and validating performance improvements through repeatable testing.

These results are experimental measurements and are not production performance guarantees.