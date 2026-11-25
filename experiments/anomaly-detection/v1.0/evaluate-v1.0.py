
import json
import sys
import time
from pathlib import Path

# Import the existing Python detection implementation.
# This keeps the v1.0 experiment separate from the original evaluator.
PARENT_FOLDER = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PARENT_FOLDER))

from evaluate import detect_anomalies

DATA_FILE = Path(__file__).with_name("test-cases-v1.0-large.json")

def main():
    with DATA_FILE.open("r", encoding="utf-8") as file:
        dataset = json.load(file)

    total_tp = 0
    total_fp = 0
    total_fn = 0

    scenario_tp = 0
    scenario_fp = 0
    scenario_fn = 0
    scenario_tn = 0

    latencies = []

    print("=" * 60)
    print("QORVILO ANOMALY DETECTION v1.0 EVALUATION")
    print("=" * 60)

    for scenario in dataset["scenarios"]:
        expected = set(scenario["expected_anomaly_ids"])

        start = time.perf_counter()
        detected = detect_anomalies(scenario["transactions"])
        latency = (time.perf_counter() - start) * 1000

        latencies.append(latency)

        tp = len(expected & detected)
        fp = len(detected - expected)
        fn = len(expected - detected)

        total_tp += tp
        total_fp += fp
        total_fn += fn

        # Scenario-level classification:
        # Does this scenario contain an anomaly?
        if expected and detected:
            scenario_tp += 1
        elif expected and not detected:
            scenario_fn += 1
        elif not expected and detected:
            scenario_fp += 1
        else:
            scenario_tn += 1

        print(f"\nScenario: {scenario['id']}")
        print("Test:", scenario["rule"])
        print("Expected:", sorted(expected))
        print("Detected:", sorted(detected))
        print("True positives:", tp)
        print("False positives:", fp)
        print("False negatives:", fn)
        print(f"Latency: {latency:.4f} ms")

    precision = (
        total_tp / (total_tp + total_fp)
        if total_tp + total_fp else 0
    )

    recall = (
        total_tp / (total_tp + total_fn)
        if total_tp + total_fn else 0
    )

    f1 = (
        2 * precision * recall / (precision + recall)
        if precision + recall else 0
    )

    scenario_fpr = (
        scenario_fp / (scenario_fp + scenario_tn)
        if scenario_fp + scenario_tn else 0
    )

    average_latency = (
        sum(latencies) / len(latencies)
        if latencies else 0
    )

    print("\n" + "=" * 60)
    print("OVERALL ALERT-LEVEL RESULTS")
    print("=" * 60)
    print("True positives:", total_tp)
    print("False positives:", total_fp)
    print("False negatives:", total_fn)
    print(f"Precision: {precision:.2%}")
    print(f"Recall: {recall:.2%}")
    print(f"F1 score: {f1:.2%}")

    print("\n" + "=" * 60)
    print("SCENARIO-LEVEL RESULTS")
    print("=" * 60)
    print("Scenario true positives:", scenario_tp)
    print("Scenario false positives:", scenario_fp)
    print("Scenario false negatives:", scenario_fn)
    print("Scenario true negatives:", scenario_tn)
    print(f"Scenario false-positive rate: {scenario_fpr:.2%}")

    print(f"\nAverage detection latency: {average_latency:.4f} ms")
    print("\nEvaluation completed.")


if __name__ == "__main__":
    main()
