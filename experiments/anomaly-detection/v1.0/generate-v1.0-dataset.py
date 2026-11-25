
import json
import random
from pathlib import Path

SEED = 20261125
random.seed(SEED)

OUTPUT_FILE = Path(__file__).with_name("test-cases-v1.0-large.json")

CATEGORIES = [
    "Shopping",
    "Food",
    "Transport",
    "Entertainment",
    "Bills"
]

scenarios = []


def transaction(tx_id, date, description, amount, category,
                tx_type="expense"):
    return {
        "id": tx_id,
        "date": date,
        "description": description,
        "amount": amount,
        "category": category,
        "type": tx_type
    }


def add_scenario(scenario_id, rule, transactions, expected=None):
    scenarios.append({
        "id": scenario_id,
        "rule": rule,
        "transactions": transactions,
        "expected_anomaly_ids": expected or []
    })


# --------------------------------------------------
# GROUP 1: 20 genuine large-expense anomalies
# --------------------------------------------------

for i in range(20):
    category = CATEGORIES[i % len(CATEGORIES)]
    prefix = f"L{i:02d}"

    baseline = random.randint(800, 1200)

    transactions = [
        transaction(f"{prefix}1", "2026-01-05",
                    "Regular purchase 1", baseline, category),
        transaction(f"{prefix}2", "2026-01-10",
                    "Regular purchase 2", baseline, category),
        transaction(f"{prefix}3", "2026-01-15",
                    "Regular purchase 3", baseline, category),
        transaction(f"{prefix}4", "2026-02-05",
                    "Unusually large purchase", 6000, category)
    ]

    add_scenario(
        f"LARGE-{i + 1:03d}",
        "large_expense_positive",
        transactions,
        [f"large-{prefix}4"]
    )


# --------------------------------------------------
# GROUP 2: 20 legitimate expenses near threshold
# --------------------------------------------------

for i in range(20):
    category = CATEGORIES[i % len(CATEGORIES)]
    prefix = f"B{i:02d}"

    baseline = 1000
    threshold = max(baseline * 2.5, baseline + 1000)

    transactions = [
        transaction(f"{prefix}1", "2026-01-05",
                    "Regular purchase 1", baseline, category),
        transaction(f"{prefix}2", "2026-01-10",
                    "Regular purchase 2", baseline, category),
        transaction(f"{prefix}3", "2026-01-15",
                    "Regular purchase 3", baseline, category),
        transaction(f"{prefix}4", "2026-02-05",
                    "Purchase just below threshold",
                    threshold - 1, category)
    ]

    add_scenario(
        f"BOUNDARY-{i + 1:03d}",
        "large_expense_below_threshold",
        transactions
    )


# --------------------------------------------------
# GROUP 3: 20 possible duplicate transactions
# --------------------------------------------------

for i in range(20):
    category = CATEGORIES[i % len(CATEGORIES)]
    prefix = f"D{i:02d}"

    amount = random.randint(500, 5000)
    date = f"2026-04-{10 + i:02d}"
    description = f"Merchant payment {i + 1}"

    transactions = [
        transaction(
            f"{prefix}1", date, description, amount, category
        ),
        transaction(
            f"{prefix}2", date, description, amount, category
        )
    ]

    add_scenario(
        f"DUPLICATE-{i + 1:03d}",
        "duplicate_positive",
        transactions,
        [f"duplicate-{prefix}2"]
    )


# --------------------------------------------------
# GROUP 4: 20 genuine category spending spikes
# --------------------------------------------------

for i in range(20):
    category = CATEGORIES[i % len(CATEGORIES)]
    prefix = f"S{i:02d}"

    baseline = random.randint(800, 1200)

    transactions = [
        transaction(f"{prefix}1", "2026-01-05",
                    "January purchase", baseline, category),
        transaction(f"{prefix}2", "2026-02-05",
                    "February purchase", baseline, category),
        transaction(f"{prefix}3", "2026-03-05",
                    "March purchase", baseline, category),

        transaction(f"{prefix}4", "2026-04-05",
                    "April purchase 1", baseline, category),
        transaction(f"{prefix}5", "2026-04-10",
                    "April purchase 2", baseline, category),
        transaction(f"{prefix}6", "2026-04-15",
                    "April purchase 3", baseline, category)
    ]

    add_scenario(
        f"SPIKE-{i + 1:03d}",
        "category_spike_positive",
        transactions,
        [f"spike-{category}-2026-04"]
    )


# --------------------------------------------------
# GROUP 5: 20 normal spending scenarios
# --------------------------------------------------

for i in range(20):
    category = CATEGORIES[i % len(CATEGORIES)]
    prefix = f"N{i:02d}"

    amounts = [
        random.randint(700, 1000),
        random.randint(700, 1000),
        random.randint(700, 1000),
        random.randint(700, 1100)
    ]

    transactions = [
        transaction(f"{prefix}1", "2026-01-05",
                    "January regular spending", amounts[0], category),
        transaction(f"{prefix}2", "2026-02-05",
                    "February regular spending", amounts[1], category),
        transaction(f"{prefix}3", "2026-03-05",
                    "March regular spending", amounts[2], category),
        transaction(f"{prefix}4", "2026-04-05",
                    "April regular spending", amounts[3], category),
        transaction(f"{prefix}5", "2026-04-08",
                    "Salary", random.randint(20000, 80000),
                    "Salary", "income")
    ]

    add_scenario(
        f"NORMAL-{i + 1:03d}",
        "normal_financial_activity",
        transactions
    )


# --------------------------------------------------
# SAVE DATASET
# --------------------------------------------------

dataset = {
    "project": "QORVILO",
    "experiment": "Anomaly Detection v1.0 - Expanded Dataset",
    "dataset_type": "synthetic",
    "currency": "KES",
    "random_seed": SEED,
    "scenario_count": len(scenarios),
    "scenarios": scenarios
}

with OUTPUT_FILE.open("w", encoding="utf-8") as file:
    json.dump(dataset, file, indent=2)

print("QORVILO v1.0 dataset generated.")
print("Random seed:", SEED)
print("Total scenarios:", len(scenarios))
print("Output:", OUTPUT_FILE)
