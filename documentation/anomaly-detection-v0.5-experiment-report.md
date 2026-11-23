# QORVILO — Anomaly Detection v0.5 Experiment Report

**Project:** QORVILO AI Personal Finance Platform  
**Experiment:** Expanded Anomaly Detection Evaluation  
**Version:** 0.5  
**Date:** 23 November 2026  
**Dataset:** Synthetic labelled transaction scenarios  
**Currency:** KES

---

## 1. Experiment Objective

The objective of v0.5 was to expand the anomaly detection evaluation dataset from seven to 100 scenarios and assess the detector against a broader range of synthetic financial activity.

The experiment also introduced additional normal-spending and near-threshold scenarios to examine whether the detection rules incorrectly flag ordinary transactions.

## 2. Dataset Composition

The dataset contains 100 scenarios:

| Scenario group | Number |
|---|---:|
| Original v0.4 scenarios | 7 |
| Large-expense scenarios | 19 |
| Possible-duplicate scenarios | 19 |
| Category-spending-spike scenarios | 19 |
| Normal-transaction scenarios | 18 |
| Near-threshold normal scenarios | 18 |
| **Total** | **100** |

The original seven v0.4 scenarios were preserved in a separate backup file.

## 3. Detection Methods

The experiment evaluated three rule-based detection methods:

1. Large Expense Detection.
2. Possible Duplicate Detection.
3. Category Spending Spike Detection.

Normal transactions were also included to test whether the rules generated unwanted alerts.

## 4. Evaluation Methodology

The Python evaluation script independently reproduces the JavaScript detection rules and compares the detected anomaly identifiers with the expected labels.

Two evaluation levels were used:

- Alert-level evaluation: measures individual anomaly detections.
- Scenario-level evaluation: classifies each complete scenario as anomalous or normal.

Performance metrics included precision, recall, false-positive rate and average detection-function execution time.

## 5. Experimental Results

### 5.1 Scenario-level results

| Metric | Result |
|---|---:|
| Total scenarios | 100 |
| Anomaly-positive scenarios correctly detected | 61 |
| Normal scenarios correctly classified | 39 |
| False-positive scenarios | 0 |
| False-negative scenarios | 0 |

All 100 constructed scenarios produced the expected scenario-level classification.

### 5.2 Alert-level results

| Metric | Result |
|---|---:|
| True-positive alerts | 62 |
| False-positive alerts | 0 |
| False-negative alerts | 0 |
| Precision | 100.00% |
| Recall | 100.00% |

The alert-level true-positive count differs from the scenario-level count because one scenario correctly triggered two different anomaly rules.

### 5.3 Scenario-level confusion matrix

| | Predicted anomaly | Predicted normal |
|---|---:|---:|
| Actual anomaly | 61 | 0 |
| Actual normal | 0 | 39 |

### 5.4 False-positive rate

The measured scenario-level false-positive rate was 0.00%.

This result applies only to the 39 normal synthetic scenarios in this experiment.

## 6. Detection Latency

The evaluator measured execution time using Python's high-resolution performance counter.

**Average measured detection-function execution time: 0.0220 milliseconds.**

This is a Python benchmark using small synthetic datasets. It is not an end-to-end measurement of the browser-based JavaScript application.

## 7. Improvements From v0.4

The v0.5 experiment introduced:

1. Dataset expansion from 7 to 100 scenarios.
2. Automated synthetic dataset generation.
3. Additional large-expense test cases.
4. Additional exact-duplicate test cases.
5. Additional category-spending-spike test cases.
6. More normal transaction scenarios.
7. Near-threshold spending scenarios.
8. Preservation of the original v0.4 dataset.
9. Expanded quantitative evaluation.

## 8. Limitations

Despite the encouraging results, several limitations remain:

- All scenarios are synthetic and do not represent real customer financial behaviour.
- Many generated scenarios share predictable structures and transaction patterns.
- The Python evaluator independently reproduces the JavaScript detection rules rather than directly executing the browser implementation.
- The dataset is not fully randomized or independent of the detection thresholds.
- The experiment does not establish production-level accuracy.
- The latency measurement does not represent end-to-end application performance.
- Risk scores have not been statistically calibrated.
- No confidence intervals have been calculated.

## 9. Future Work

The next research phase should focus on:

1. Generating more diverse randomized transaction patterns.
2. Introducing unseen test cases that are not used during threshold development.
3. Testing borderline and misleading transaction patterns.
4. Evaluating performance on larger transaction histories.
5. Connecting the Python evaluator directly to the JavaScript detection engine.
6. Running repeated latency benchmarks.
7. Comparing rule-based detection with statistical anomaly detection.
8. Measuring precision, recall and false-positive rates on a broader independent dataset.

## 10. Conclusion

QORVILO Anomaly Detection v0.5 successfully expanded the synthetic evaluation dataset to 100 scenarios.

The detector correctly classified all 100 constructed scenarios, producing 62 correctly detected anomaly alerts and no false-positive or false-negative results in this test set.

The results demonstrate that the implemented rules behave as expected on the selected synthetic cases. However, the predictable structure of the dataset means that further independent and randomized testing is necessary before making claims about real-world detection accuracy.

**Experiment status:** Completed — 100-scenario synthetic evaluation.

**Project:** QORVILO AI Personal Finance Platform  
**Research area:** Financial anomaly detection and performance evaluation.