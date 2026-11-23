
import random
import sys
from pathlib import Path

# Import the existing anomaly detection evaluator
PROJECT_FOLDER = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_FOLDER))

from evaluate import detect_anomalies

# Fixed seed makes each experiment reproducible
rng = random.Random(20261123)

SCENARIO_COUNT = 20
results = []


def transaction(identifier, date, description, amount, category):
    return {
        "id": identifier,
        "date": date,
        "description": description,
        "amount": amount,
        "category": category,
        "type": "expense"
    }


def add_scenario(name, transactions, expected_ids):
    detected = detect_anomalies(transactions)
    detected_ids = set(detected)
    expected_ids = set(expected_ids)

    passed = detected_ids == expected_ids

    results.append({
        "name": name,
        "passed": passed,
        "expected": expected_ids,
        "detected": detected_ids
    })


# 1. Randomized large-expense scenarios
for number in range(SCENARIO_COUNT):
    prefix = f"L{number:03d}"
    base = rng.randint(500, 1500)
    large_amount = base * 4

    records = [
        transaction(f"{prefix}-1", "2026-10-01", "Normal expense A", base, "Shopping"),
        transaction(f"{prefix}-2", "2026-10-05", "Normal expense B", base, "Shopping"),
        transaction(f"{prefix}-3", "2026-10-10", "Normal expense C", base, "Shopping"),
        transaction(f"{prefix}-4", "2026-11-01", "Unusual expense", large_amount, "Shopping")
    ]

    add_scenario(
        f"Large expense {number + 1}",
        records,
        [f"large-{prefix}-4"]
    )


# 2. Randomized duplicate scenarios
for number in range(SCENARIO_COUNT):
    prefix = f"D{number:03d}"
    amount = rng.randint(100, 10000)
    date = f"2026-11-{rng.randint(1, 20):02d}"

    records = [
        transaction(f"{prefix}-1", date, "Repeated payment", amount, "Shopping"),
        transaction(f"{prefix}-2", date, "Repeated payment", amount, "Shopping")
    ]

    add_scenario(
        f"Duplicate {number + 1}",
        records,
        [f"duplicate-{prefix}-2"]
    )


# 3. Randomized category-spending-spike scenarios
for number in range(SCENARIO_COUNT):
    prefix = f"S{number:03d}"
    base = rng.randint(500, 1000)

    records = []

    for month in ["07", "08", "09"]:
        records.append(
            transaction(
                f"{prefix}-{month}-1",
                f"2026-{month}-01",
                "Regular transport A",
                base,
                "Transport"
            )
        )
        records.append(
            transaction(
                f"{prefix}-{month}-2",
                f"2026-{month}-02",
                "Regular transport B",
                base,
                "Transport"
            )
        )

    records.extend([
        transaction(
            f"{prefix}-10-1",
            "2026-10-01",
            "Increased transport A",
            base * 2,
            "Transport"
        ),
        transaction(
            f"{prefix}-10-2",
            "2026-10-02",
            "Increased transport B",
            base * 2,
            "Transport"
        )
    ])

    add_scenario(
        f"Category spike {number + 1}",
        records,
        ["spike-Transport-2026-10"]
    )


# 4. Randomized normal transaction scenarios
for number in range(SCENARIO_COUNT):
    prefix = f"N{number:03d}"

    records = [
        transaction(
            f"{prefix}-1", "2026-11-01",
            "Groceries", rng.randint(100, 800), "Groceries"
        ),
        transaction(
            f"{prefix}-2", "2026-11-05",
            "Transport", rng.randint(100, 500), "Transport"
        ),
        transaction(
            f"{prefix}-3", "2026-11-10",
            "Lunch", rng.randint(100, 400), "Food"
        )
    ]

    add_scenario(
        f"Normal activity {number + 1}",
        records,
        []
    )


# 5. Near-threshold normal spending scenarios
for number in range(SCENARIO_COUNT):
    prefix = f"E{number:03d}"
    base = rng.randint(500, 1000)

    records = []

    for month in ["07", "08", "09"]:
        records.extend([
            transaction(
                f"{prefix}-{month}-1",
                f"2026-{month}-01",
                "Regular transport A",
                base,
                "Transport"
            ),
            transaction(
                f"{prefix}-{month}-2",
                f"2026-{month}-02",
                "Regular transport B",
                base,
                "Transport"
            )
        ])

    records.extend([
        transaction(
            f"{prefix}-10-1",
            "2026-10-01",
            "Slightly higher transport A",
            int(base * 1.5),
            "Transport"
        ),
        transaction(
            f"{prefix}-10-2",
            "2026-10-02",
            "Slightly higher transport B",
            int(base * 1.5),
            "Transport"
        )
    ])

    add_scenario(
        f"Near-threshold activity {number + 1}",
        records,
        []
    )


# Print experiment results
passed_count = sum(item["passed"] for item in results)
failed_count = len(results) - passed_count

print("=" * 55)
print("QORVILO ANOMALY DETECTION v0.6")
print("RANDOMIZED ROBUSTNESS TEST")
print("=" * 55)

print(f"Total scenarios: {len(results)}")
print(f"Passed: {passed_count}")
print(f"Failed: {failed_count}")

print("\nRESULTS BY TEST CATEGORY")

for category, prefix in [
    ("Large expenses", "Large expense"),
    ("Duplicates", "Duplicate"),
    ("Category spikes", "Category spike"),
    ("Normal activity", "Normal activity"),
    ("Near-threshold activity", "Near-threshold activity")
]:
    category_results = [
        item for item in results
        if item["name"].startswith(prefix)
    ]

    category_passed = sum(
        item["passed"] for item in category_results
    )

    print(
        f"{category}: {category_passed}/"
        f"{len(category_results)} passed"
    )


if failed_count:
    print("\nFAILED SCENARIOS")

    for item in results:
        if not item["passed"]:
            print(f"\n{item['name']}")
            print(f"Expected: {sorted(item['expected'])}")
            print(f"Detected: {sorted(item['detected'])}")

print("\nExperiment completed.")
