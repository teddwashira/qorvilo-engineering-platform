
import json
from pathlib import Path
from collections import Counter

FEEDBACK_FILE = Path(__file__).with_name("feedback-v1.0.json")


def evaluate_feedback():
    if not FEEDBACK_FILE.exists():
        print("No feedback dataset found.")
        print(f"Create: {FEEDBACK_FILE}")
        return

    with FEEDBACK_FILE.open("r", encoding="utf-8") as file:
        feedback = json.load(file)

    if not isinstance(feedback, list):
        raise ValueError("Feedback data must be a JSON list.")

    valid_assessments = {"expected", "suspicious"}
    counts = Counter()

    for item in feedback:
        assessment = item.get("assessment")

        if assessment not in valid_assessments:
            print(f"Skipping invalid assessment: {item}")
            continue

        counts[assessment] += 1

    total = sum(counts.values())

    print("\nQORVILO USER FEEDBACK REPORT")
    print("=" * 35)
    print(f"Total valid assessments: {total}")
    print(f"Expected activity: {counts['expected']}")
    print(f"Suspicious activity: {counts['suspicious']}")

    if total:
        expected_rate = counts["expected"] / total * 100
        suspicious_rate = counts["suspicious"] / total * 100

        print(f"Expected activity rate: {expected_rate:.2f}%")
        print(f"Suspicious activity rate: {suspicious_rate:.2f}%")
    else:
        print("No valid feedback assessments to analyse.")


if __name__ == "__main__":
    evaluate_feedback()
