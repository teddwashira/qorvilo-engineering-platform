# QORVILO — Anomaly Detection v0.4 Experiment Report

**Project:** QORVILO AI Personal Finance Platform  
**Experiment:** Expanded Anomaly Detection Evaluation  
**Version:** 0.4  
**Date:** 23 November 2026  
**Dataset:** Synthetic labelled transaction scenarios  
**Currency:** Kenyan Shillings (KES)

---

## 1. Experiment Objective

The objective of Anomaly Detection v0.4 was to improve the reliability of the QORVILO anomaly detection evaluation process.

The experiment expanded the original four test scenarios to seven and introduced additional normal-spending and edge-case scenarios.

It also improved the evaluation methodology by separating alert-level metrics from scenario-level classification metrics.

## 2. Detection Methods

The system evaluates three rule-based detection methods:

1. **Large Expense Detection:** Identifies expenses significantly higher than historical spending in the same category.
2. **Possible Duplicate Detection:** Identifies expenses with matching descriptions, amounts, categories and dates.
3. **Category Spending Spike Detection:** Identifies substantial increases in monthly category spending compared with preceding recorded months.

## 3. Expanded Test Dataset

Seven synthetic scenarios were evaluated.

| ID | Test scenario | Expected behaviour |
|---|---|---|
| SC001 | Large expense | Detect unusually large expense |
| SC002 | Exact duplicate | Detect duplicate transaction |
| SC003 | Large expense and spending spike | Detect both anomalies |
| SC004 | Normal transactions | No alerts |
| SC005 | Normal spending pattern | No alerts |
| SC006 | Category spike from moderate expenses | Detect spending spike only |
| SC007 | Similar transactions on different dates | No duplicate alert |

### Additional test coverage

SC005 tested whether ordinary monthly spending increases would incorrectly trigger alerts.

SC006 tested whether several moderate expenses could collectively trigger a category spending spike without individually triggering large-expense detection.

SC007 tested whether similar transactions occurring on different dates would be incorrectly classified as duplicates.

## 4. Evaluation Methodology

The Python evaluator independently reproduces the JavaScript detection rules using the synthetic test dataset.

It measures two separate evaluation levels.

### 4.1 Alert-level evaluation

Each expected anomaly identifier is compared with the identifiers produced by the detector.

The following metrics are calculated:

- True positives
- False positives
- False negatives
- Precision
- Recall

### 4.2 Scenario-level evaluation

Each complete scenario is classified according to its expected and actual anomaly status.

| Classification | Meaning |
|---|---|
| True positive | An anomalous scenario generated an alert |
| False positive | A normal scenario generated an alert |
| False negative | An anomalous scenario generated no alert |
| True negative | A normal scenario generated no alert |

This separation avoids mixing individual alert counts with transaction-level normal counts.

## 5. Experimental Results

### 5.1 Scenario test results

| Scenario | Result |
|---|---|
| SC001 | PASS |
| SC002 | PASS |
| SC003 | PASS |
| SC004 | PASS |
| SC005 | PASS |
| SC006 | PASS |
| SC007 | PASS |

**Total:** 7 of 7 scenarios passed.

### 5.2 Alert-level results

| Metric | Result |
|---|---:|
| True positives | 5 |
| False positives | 0 |
| False negatives | 0 |
| Precision | 100.00% |
| Recall | 100.00% |

### 5.3 Scenario-level confusion matrix

| | Predicted anomaly | Predicted normal |
|---|---:|---:|
| Actual anomaly | 4 | 0 |
| Actual normal | 0 | 3 |

### 5.4 Scenario-level performance

| Metric | Result |
|---|---:|
| Scenario true positives | 4 |
| Scenario false positives | 0 |
| Scenario false negatives | 0 |
| Scenario true negatives | 3 |
| Precision | 100.00% |
| Recall | 100.00% |
| False-positive rate | 0.00% |

These values describe performance on the seven constructed scenarios only.

## 6. Detection Latency

The evaluator uses Python's high-resolution performance counter to measure detection-function execution time.

| Measurement | Result |
|---|---:|
| Average detection latency | 0.0247 ms |

This is Python evaluator execution time on small synthetic datasets. It does not represent browser-side JavaScript latency or complete application response time.

## 7. Improvements From v0.3

The v0.4 experiment introduced the following improvements:

1. Expanded the dataset from four to seven scenarios.
2. Added normal-spending pattern testing.
3. Added category-spike testing using multiple moderate expenses.
4. Added similar transactions occurring on different dates.
5. Corrected the expected labels for overlapping anomaly detections.
6. Separated alert-level and scenario-level evaluation.
7. Improved metric labelling to avoid confusing transaction counts with scenario counts.

## 8. Limitations

The experiment has several limitations:

- The dataset contains only seven synthetic scenarios.
- The test data does not represent real financial behaviour.
- The Python evaluator independently reproduces the JavaScript detection rules rather than directly executing the browser implementation.
- The evaluation does not measure real-world false-positive or false-negative rates.
- The latency benchmark uses small datasets and a limited number of runs.
- Detection thresholds have not been calibrated against representative financial data.
- No statistical confidence intervals have been calculated.

## 9. Future Work

The next research phase will focus on:

1. Expanding the labelled dataset to at least 100 test scenarios.
2. Introducing more edge cases and transaction patterns.
3. Testing detection thresholds under different spending distributions.
4. Measuring performance across larger transaction volumes.
5. Running repeated latency benchmarks.
6. Connecting the evaluator directly to the JavaScript detection engine.
7. Comparing rule-based detection with statistical anomaly detection techniques.
8. Measuring precision, recall and false-positive rates on a broader test dataset.

## 10. Conclusion

The QORVILO Anomaly Detection v0.4 experiment successfully expanded the initial evaluation dataset and improved the consistency of its evaluation methodology.

All seven constructed scenarios produced the expected results.

The experiment also demonstrated the importance of distinguishing alert-level evaluation from scenario-level classification.

Although the initial results are encouraging, the dataset remains too small to establish real-world detection accuracy or production readiness.

**Experiment status:** Completed — expanded synthetic evaluation.

**Project:** QORVILO AI Personal Finance Platform  
**Research area:** Financial anomaly detection and performance evaluation.