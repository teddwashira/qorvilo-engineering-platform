# QORVILO — Anomaly Detection Test Report

**Version:** Anomaly Detection v0.2  
**Test date:** 23 November 2026  
**Test environment:** Local development environment  
**Test data:** Synthetic transactions  
**Status:** Initial functional testing

---

## 1. Objective

The purpose of this test is to evaluate whether QORVILO can identify unusual financial transactions using rule-based anomaly detection.

The system currently implements three detection rules:

1. Unusually large expenses.
2. Category spending spikes.
3. Possible duplicate transactions.

The system assigns a heuristic risk score between 0 and 100 to detected anomalies.

## 2. Detection Architecture

The anomaly detection engine is implemented in JavaScript and analyses locally stored transaction records.

It runs when transactions are saved and updates the Anomaly Detection dashboard.

High-priority findings can also trigger immediate notifications.

The current system does not rely on a trained machine-learning model. Its detection decisions are based on transparent rules and historical transaction comparisons.

## 3. Detection Rules

### 3.1 Unusually Large Expenses

The engine compares an expense against the historical median for the same spending category.

A transaction is flagged when its amount is at least:

- 2.5 times the historical median; or
- KES 1,000 above the historical median,

whichever threshold is greater.

Risk score:

`min(100, max(30, round((expense amount / historical median) × 28)))`

### 3.2 Category Spending Spikes

The engine compares recorded monthly spending in a category against the average of up to three preceding recorded months.

A spike is detected when:

- Current spending is at least 1.8 times the historical average.
- The increase is at least KES 1,000.

Risk score:

`min(100, max(30, round((current spending / historical average) × 35)))`

### 3.3 Possible Duplicate Transactions

The engine checks whether two expense transactions share the same:

- Description.
- Amount.
- Category.
- Transaction date.

A matching transaction is flagged as a possible duplicate.

Initial heuristic risk score: **85/100**.

## 4. Risk Classification

| Score | Classification |
|---|---|
| 0–29 | Low risk |
| 30–69 | Medium risk |
| 70–100 | High risk |

These scores are heuristic indicators. They are not calibrated probabilities of fraud or financial loss.

## 5. Functional Test Results

### Test 1: Large Expense Detection

**Test setup:**

Three historical Shopping expenses were created:

| Transaction | Amount |
|---|---:|
| Risk Test 1 | KES 1,000 |
| Risk Test 2 | KES 1,000 |
| Risk Test 3 | KES 1,000 |

A larger Shopping expense was then introduced.

**Observed result:** A KES 6,000 expense was detected and displayed a risk score of 84/100 after the scoring formula was updated.

**Status:** PASS — detection and updated scoring displayed successfully.

### Test 2: Category Spending Spike Detection

**Test setup:**

Synthetic monthly Shopping expenses were added:

| Month | Amount |
|---|---:|
| July 2026 | KES 2,000 |
| August 2026 | KES 2,000 |
| September 2026 | KES 2,000 |
| October 2026 | KES 6,000 |

**Observed result:** A medium-priority alert was reported during testing. However, the displayed 60/100 score was subsequently identified as belonging to an unusually large expense alert.

**Status:** NOT YET VERIFIED — the category-spike alert's own risk score still requires confirmation.

### Test 3: Duplicate Transaction Detection

**Test setup:**

Two expense transactions were entered with identical descriptions, amounts, categories and dates.

**Observed result:** QORVILO detected the possible duplicate and displayed:

**85/100 — HIGH RISK**

**Status:** PASS — duplicate detection and risk-score display worked.

## 6. Summary of Results

| Detection rule | Current status |
|---|---|
| Large expense detection | PASS |
| Category spending spike | Pending verification |
| Duplicate transaction detection | PASS |

These results demonstrate initial functional behaviour using controlled synthetic data. They do not establish real-world detection accuracy.

## 7. Known Limitations

1. The system uses manually defined rules rather than a trained anomaly detection model.
2. Historical comparisons depend on the available transaction records.
3. Missing or limited historical data can reduce detection reliability.
4. Exact-match duplicate detection may miss duplicates with slightly different descriptions.
5. Risk scores are heuristic and have not been statistically calibrated.
6. Testing has used synthetic data rather than a representative real-world financial dataset.
7. False-positive and false-negative rates have not yet been measured.

## 8. Future Engineering Work

Planned improvements include:

- Verify category-spike scoring independently.
- Build a labelled synthetic anomaly dataset.
- Measure precision, recall and false-positive rate.
- Evaluate detection performance across different transaction categories.
- Investigate more advanced statistical anomaly detection methods.
- Compare rule-based detection against alternative algorithms.
- Measure detection latency and system reliability.

## 9. Conclusion

QORVILO Anomaly Detection v0.2 demonstrates an initial rule-based financial monitoring system capable of identifying unusually large expenses and potential duplicate transactions.

Initial functional tests have been successful for those two rules. Category-spending spike scoring remains to be independently verified.

Further controlled testing and quantitative evaluation are required before making claims about production-level accuracy or reliability.

---

**Project:** QORVILO Engineering Platform  
**Component:** QORVILO AI — Anomaly Detection  
**Document type:** Engineering Test Report