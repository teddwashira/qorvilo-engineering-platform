
import json
from pathlib import Path

FOLDER = Path(__file__).parent
BACKUP_FILE = FOLDER / "test-cases-v0.4-backup.json"
OUTPUT_FILE = FOLDER / "test-cases.json"

with open(BACKUP_FILE, "r", encoding="utf-8") as file:
    dataset = json.load(file)

scenarios = dataset["scenarios"]


def transaction(identifier, date, description, amount, category="Shopping"):
    return {
        "id": identifier,
        "date": date,
        "description": description,
        "amount": amount,
        "category": category,
        "type": "expense"
    }


def add_scenario(identifier, rule, transactions, expected):
    scenarios.append({
        "id": identifier,
        "rule": rule,
        "transactions": transactions,
        "expected_anomaly_ids": expected
    })


# Generate 19 large-expense scenarios
for number in range(1, 20):
    prefix = f"L{number:03d}"

    records = [
        transaction(f"{prefix}-1", "2026-10-01", "Normal shopping 1", 1000),
        transaction(f"{prefix}-2", "2026-10-05", "Normal shopping 2", 1000),
        transaction(f"{prefix}-3", "2026-10-10", "Normal shopping 3", 1000),
        transaction(f"{prefix}-4", "2026-11-01", "Large shopping", 4000)
    ]

    add_scenario(
        f"SC{len(scenarios) + 1:03d}",
        "large_expense",
        records,
        [f"large-{prefix}-4"]
    )


# Generate 19 exact-duplicate scenarios
for number in range(1, 20):
    prefix = f"D{number:03d}"

    records = [
        transaction(f"{prefix}-1", "2026-11-05", "Duplicate test", 5000),
        transaction(f"{prefix}-2", "2026-11-05", "Duplicate test", 5000)
    ]

    add_scenario(
        f"SC{len(scenarios) + 1:03d}",
        "possible_duplicate",
        records,
        [f"duplicate-{prefix}-2"]
    )


# Generate 19 category-spending-spike scenarios
for number in range(1, 20):
    prefix = f"S{number:03d}"

    records = []

    for month in ["07", "08", "09"]:
        records.append(
            transaction(
                f"{prefix}-{month}-1",
                f"2026-{month}-01",
                "Regular transport A",
                1000,
                "Transport"
            )
        )
        records.append(
            transaction(
                f"{prefix}-{month}-2",
                f"2026-{month}-02",
                "Regular transport B",
                1000,
                "Transport"
            )
        )

    records.extend([
        transaction(
            f"{prefix}-10-1",
            "2026-10-01",
            "October transport A",
            1800,
            "Transport"
        ),
        transaction(
            f"{prefix}-10-2",
            "2026-10-02",
            "October transport B",
            1800,
            "Transport"
        )
    ])

    add_scenario(
        f"SC{len(scenarios) + 1:03d}",
        "category_spending_spike",
        records,
        ["spike-Transport-2026-10"]
    )


# Generate 18 normal transaction scenarios
for number in range(1, 19):
    prefix = f"N{number:03d}"

    records = [
        transaction(f"{prefix}-1", "2026-11-01", "Groceries", 500, "Groceries"),
        transaction(f"{prefix}-2", "2026-11-05", "Transport", 300, "Transport"),
        transaction(f"{prefix}-3", "2026-11-10", "Lunch", 200, "Food")
    ]

    add_scenario(
        f"SC{len(scenarios) + 1:03d}",
        "normal_transactions",
        records,
        []
    )


# Generate 18 near-threshold normal spending scenarios
for number in range(1, 19):
    prefix = f"E{number:03d}"

    records = []

    for month in ["07", "08", "09"]:
        records.extend([
            transaction(
                f"{prefix}-{month}-1",
                f"2026-{month}-01",
                "Regular transport A",
                1000,
                "Transport"
            ),
            transaction(
                f"{prefix}-{month}-2",
                f"2026-{month}-02",
                "Regular transport B",
                1000,
                "Transport"
            )
        ])

    records.extend([
        transaction(
            f"{prefix}-10-1",
            "2026-10-01",
            "October transport A",
            1500,
            "Transport"
        ),
        transaction(
            f"{prefix}-10-2",
            "2026-10-02",
            "October transport B",
            1500,
            "Transport"
        )
    ])

    add_scenario(
        f"SC{len(scenarios) + 1:03d}",
        "near_threshold_normal",
        records,
        []
    )


dataset["experiment"] = "Anomaly Detection v0.5"
dataset["scenarios"] = scenarios

with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
    json.dump(dataset, file, indent=2)

print("=" * 45)
print("QORVILO v0.5 DATASET GENERATION")
print("=" * 45)
print(f"Original scenarios preserved: 7")
print(f"New scenarios generated: {len(scenarios) - 7}")
print(f"Total scenarios: {len(scenarios)}")
print(f"Dataset saved to: {OUTPUT_FILE.name}")
