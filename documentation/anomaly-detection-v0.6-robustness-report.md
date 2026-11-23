# QORVILO Anomaly Detection v0.6 — Robustness Testing Report

**Project:** QORVILO AI Personal Finance Platform  
**Experiment:** Anomaly Detection v0.6  
**Test Date:** 23 November 2026  
**Status:** Completed  
**Test Environment:** Python-based evaluation of the anomaly detection rules

---

## 1. Objective

The objective of this experiment was to evaluate the robustness of QORVILO's anomaly detection logic against varied synthetic transaction patterns.

The experiment extended the earlier v0.5 evaluation by introducing randomized transaction amounts and dates across five test categories.

## 2. Test Dataset

A total of 100 scenarios were generated using Python's random number generator with a fixed seed (`20261123`) to ensure reproducibility.

| Test category | Scenarios |
|---|---:|
| Large expense detection | 20 |
| Duplicate transaction detection | 20 |
| Category spending spike detection | 20 |
| Normal financial activity | 20 |
| Near-threshold spending activity | 20 |
| **Total** | **100** |

## 3. Methodology

The experiment used the existing Python `detect_anomalies()` function from `evaluate.py`.

Each scenario contained synthetic financial transactions with predefined expected anomaly IDs.

The test runner compared the detected anomaly IDs against the expected IDs. A scenario passed only when both sets matched exactly.

The five test categories examined:

1. Large expenses compared with historical category spending.
2. Exact duplicate transactions.
3. Monthly category spending spikes.
4. Normal transactions that should not trigger alerts.
5. Spending patterns close to detection thresholds.

## 4. Results

| Test category | Passed | Failed |
|---|---:|---:|
| Large expenses | 20 | 0 |
| Duplicate transactions | 20 | 0 |
| Category spending spikes | 20 | 0 |
| Normal activity | 20 | 0 |
| Near-threshold activity | 20 | 0 |
| **Total** | **100** | **0** |

**Overall scenario pass rate: 100%**

All 100 scenarios produced the expected detection results.

## 5. Interpretation

The results indicate that the Python implementation correctly handled the tested transaction variations.

The detector identified the injected anomalies and did not flag the normal or near-threshold scenarios in this test dataset.

These findings provide preliminary evidence of robustness under the tested synthetic conditions.

## 6. Limitations

The experiment has several limitations:

- All transactions were synthetically generated.
- A fixed random seed was used, so the experiment is reproducible but does not explore every possible random dataset.
- The Python evaluator independently reproduces the JavaScript detection rules; it does not directly execute the browser-based JavaScript engine.
- The test scenarios are structured around the known detection rules.
- The results do not establish real-world precision, recall, or production reliability.
- Performance was not benchmarked in this experiment.

Therefore, the 100% scenario pass rate must not be interpreted as 100% real-world detection accuracy.

## 7. Future Improvements

The next development stages should include:

- Randomized testing with multiple seeds.
- More varied transaction descriptions, categories, dates and amounts.
- Edge cases such as missing fields, zero values and invalid dates.
- Larger transaction datasets.
- Direct automated testing of the JavaScript detection engine.
- False-positive and false-negative analysis on independently labelled test data.
- Repeated execution-time measurements.

## 8. Conclusion

QORVILO Anomaly Detection v0.6 successfully passed all 100 scenarios in the initial synthetic robustness experiment.

The results demonstrate that the Python evaluation implementation behaved as expected across five test categories.

Further independent testing is required before making claims about real-world detection accuracy or production readiness.

---

**Experiment:** QORVILO Anomaly Detection v0.6  
**Result:** 100/100 scenarios passed  
**Next milestone:** Expanded edge-case testing and direct JavaScript engine validation.