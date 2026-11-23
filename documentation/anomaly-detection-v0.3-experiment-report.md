# QORVILO — Anomaly Detection v0.3 Experiment Report

**Project:** QORVILO AI Personal Finance Platform  
**Experiment:** Anomaly Detection Performance Evaluation  
**Version:** 0.3  
**Date:** 23 November 2026  
**Dataset:** Synthetic transaction dataset  
**Currency:** Kenyan Shillings (KES)

---

## 1. Objective

The objective of this experiment was to evaluate QORVILO's rule-based financial anomaly detection system using controlled synthetic transaction scenarios.

The experiment measured:

- Detection precision
- Detection recall
- False-positive rate
- Detection latency

## 2. Detection methods

Three detection rules were evaluated:

1. **Large expense detection:** Identifies expenses significantly above historical spending in the same category.
2. **Possible duplicate detection:** Identifies expenses with matching descriptions, amounts, categories and dates.
3. **Category spending spike detection:** Identifies substantial increases in monthly category spending compared with preceding recorded months.

## 3. Experimental design

Four synthetic scenarios were created:

| Scenario | Description | Expected result |
|---|---|---|
| SC001 | Large expense | Detect large-L4 |
| SC002 | Duplicate transaction | Detect duplicate-D2 |
| SC003 | Category spending spike | Detect October spending spike |
| SC004 | Normal transactions | Generate no alerts |

The Python evaluator independently implements the JavaScript detection rules to reproduce their behaviour against the test dataset.

It is an independent evaluation implementation, not a direct integration with the browser-based JavaScript engine.

## 4. Experimental results

### 4.1 Detection results

| Scenario | Expected alerts | Actual alerts | Result |
|---|---:|---:|---|
| SC001 | 1 | 1 | Correct detection |
| SC002 | 1 | 1 | Correct detection |
| SC003 | 1 | 2 | Additional alert |
| SC004 | 0 | 0 | Correctly ignored |

### 4.2 Overall metrics

| Metric | Result |
|---|---:|
| True positives | 3 |
| False positives | 1 |
| False negatives | 0 |
| True negatives | 3 |
| Precision | 75.00% |
| Recall | 100.00% |
| Preliminary false-positive rate | 25.00% |

**Interpretation:**

The evaluator detected all three expected anomaly alerts. However, one additional alert was generated during the category spending spike scenario.

The additional alert was `large-S4`, which was triggered by the large-expense rule alongside the category spending spike alert.

This demonstrates that multiple detection rules can identify the same unusual financial event.

The reported false-positive rate is preliminary because the current evaluation mixes alert-level false positives with transaction-level true negatives. A consistent transaction-level evaluation is required before treating this figure as a reliable false-positive rate.

## 5. Detection latency

The Python evaluator measured execution time using Python's high-resolution performance counter.

| Scenario | Latency |
|---|---:|
| SC001 | 0.0559 ms |
| SC002 | 0.0148 ms |
| SC003 | 0.0253 ms |
| SC004 | 0.0138 ms |
| **Average** | **0.0275 ms** |

The measured average represents Python detection-function execution time on the small synthetic scenarios.

It does not represent complete application response time, browser execution time or production performance.

## 6. Limitations

The experiment has several limitations:

- The dataset contains only four scenarios.
- All test transactions are synthetic.
- The Python evaluator independently reproduces the JavaScript detection rules.
- The additional alert in SC003 has not yet been classified conclusively as a false positive.
- The false-positive rate requires a consistent transaction-level evaluation.
- The latency measurements are based on very small datasets.
- No real-world financial data has been used.
- Detection thresholds have not been calibrated against a representative dataset.

## 7. Future improvements

The next development phase will focus on:

1. Building a larger labelled synthetic dataset.
2. Improving transaction-level precision, recall and false-positive calculations.
3. Investigating overlapping anomaly alerts.
4. Measuring performance across larger transaction volumes.
5. Comparing rule-based detection with statistical anomaly detection methods.
6. Measuring browser-side detection latency.
7. Testing detection reliability and edge cases.

## 8. Conclusion

The QORVILO Anomaly Detection v0.3 experiment successfully established an automated evaluation workflow.

The initial experiment demonstrated that the implemented detection rules could identify the expected anomalies in the controlled test scenarios.

The Python evaluator also successfully measured execution latency and generated preliminary detection metrics.

Further testing is required before making claims about real-world detection accuracy or production performance.

**Experiment status:** Initial evaluation completed. Further validation required.

**Project:** QORVILO AI  
**Research area:** Financial anomaly detection and performance evaluation.