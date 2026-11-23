
import json
from pathlib import Path
from statistics import median
from collections import defaultdict
import math
import time

DATA_FILE = Path(__file__).with_name("test-cases.json")


def detect_anomalies(transactions):
    anomalies = set()

    valid = [
        t for t in transactions
        if isinstance(t, dict)
        and isinstance(t.get("id"), (str, int))
        and isinstance(t.get("date"), str)
        and len(t["date"]) >= 7
        and t.get("type") in ("income", "expense")
        and isinstance(t.get("amount"), (int, float))
        and not isinstance(t.get("amount"), bool)
        and math.isfinite(t["amount"])
        and t["amount"] > 0
    ]

    valid.sort(key=lambda t: str(t["date"]))
    expenses = [t for t in valid if t["type"] == "expense"]

    # Rule 1: Large expenses
    for item in expenses:
        previous = [
            p for p in expenses
            if p["id"] != item["id"]
            and p.get("category") == item.get("category")
            and p["date"] < item["date"]
        ]

        if len(previous) < 3:
            continue

        historical_median = median(
            p["amount"] for p in previous
        )

        if item["amount"] >= max(
            historical_median * 2.5,
            historical_median + 1000
        ):
            anomalies.add(f"large-{item['id']}")

    # Rule 2: Category spending spikes
    monthly_totals = defaultdict(float)

    for item in expenses:
        month = item["date"][:7]
        category = item.get("category") or "Other"
        monthly_totals[(category, month)] += item["amount"]

    categories = {
        item.get("category") or "Other"
        for item in expenses
    }

    for category in categories:
        months = sorted({
            item["date"][:7]
            for item in expenses
            if (item.get("category") or "Other") == category
        })

        for index, month in enumerate(months):
            if index < 2:
                continue

            previous_months = months[max(0, index - 3):index]

            average = sum(
                monthly_totals[(category, previous)]
                for previous in previous_months
            ) / len(previous_months)

            current_total = monthly_totals[(category, month)]

            if (
                average > 0
                and current_total >= average * 1.8
                and current_total - average >= 1000
            ):
                anomalies.add(f"spike-{category}-{month}")

    # Rule 3: Possible duplicates
    seen = set()

    for item in expenses:
        key = (
            str(item.get("description") or "").strip().lower(),
            item["amount"],
            (item.get("category") or "Other").lower(),
            item["date"]
        )

        if key in seen:
            anomalies.add(f"duplicate-{item['id']}")
        else:
            seen.add(key)

    return anomalies


def main():
    with DATA_FILE.open("r", encoding="utf-8") as file:
        dataset = json.load(file)

    total_tp = 0
    total_fp = 0
    total_fn = 0
    total_tn = 0
    latency_results = []

    print("=" * 55)
    print("QORVILO ANOMALY DETECTION EVALUATION")
    print("=" * 55)

    for scenario in dataset["scenarios"]:
        expected = set(scenario["expected_anomaly_ids"])
        start_time = time.perf_counter()
        detected = detect_anomalies(scenario["transactions"])
        latency_ms = (time.perf_counter() - start_time) * 1000
        latency_results.append(latency_ms)

        tp = len(expected & detected)
        fp = len(detected - expected)
        fn = len(expected - detected)

        # In normal-only scenarios, every valid transaction is a
        # labelled negative unless the evaluator produced an alert for it.
        if scenario["rule"] == "normal_transactions":
            flagged_ids = set()
            for alert_id in detected:
                parts = alert_id.split("-", 1)
                if len(parts) == 2:
                    flagged_ids.add(parts[1])
            tn = sum(
                1 for transaction in scenario["transactions"]
                if str(transaction.get("id")) not in flagged_ids
            )
        else:
            tn = 0

        total_tp += tp
        total_fp += fp
        total_fn += fn
        total_tn += tn

        precision = tp / (tp + fp) if tp + fp else 0
        recall = tp / (tp + fn) if tp + fn else 0

        print(f"\nScenario: {scenario['id']}")
        print("Rule:", scenario["rule"])
        print("Expected:", sorted(expected))
        print("Detected:", sorted(detected))
        print("True positives:", tp)
        print("False positives:", fp)
        print("False negatives:", fn)
        print("True negatives:", tn)
        print(f"Detection latency: {latency_ms:.4f} ms")
        print(f"Precision: {precision:.2%}")
        print(f"Recall: {recall:.2%}")

    overall_precision = (
        total_tp / (total_tp + total_fp)
        if total_tp + total_fp else 0
    )
    overall_recall = (
        total_tp / (total_tp + total_fn)
        if total_tp + total_fn else 0
    )
    false_positive_rate = (
        total_fp / (total_fp + total_tn)
        if total_fp + total_tn else 0
    )
    average_latency = (
    sum(latency_results) / len(latency_results)
    if latency_results else 0
)

    print("\n" + "=" * 55)
    print("OVERALL RESULTS")
    print("=" * 55)
    print("True positives:", total_tp)
    print("False positives:", total_fp)
    print("False negatives:", total_fn)
    print("True negatives:", total_tn)
    print(f"Overall precision: {overall_precision:.2%}")
    print(f"Overall recall: {overall_recall:.2%}")
    print(f"False-positive rate: {false_positive_rate:.2%}")
    print(f"Average detection latency: {average_latency:.4f} ms")

    print("\nEvaluation completed.")


if __name__ == "__main__":
    main()

