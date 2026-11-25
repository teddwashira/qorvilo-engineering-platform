
def analyse_context(anomaly):
    """
    Add context to an anomaly without suppressing the original alert.

    This is a transparent rule-based prototype, not a trained AI model.
    """

    if anomaly.get("duplicate_detected") is True:
        return {
            "context": "duplicate_detected",
            "message": "A matching transaction was detected.",
            "keep_alert": True
        }

    suspicious_count = anomaly.get("suspicious_feedback_count", 0)
    expected_count = anomaly.get("expected_feedback_count", 0)
    recurring_count = anomaly.get("recurring_pattern_count", 0)
    history_months = anomaly.get("history_months", 0)
    behavior_change = anomaly.get("behavior_change_reported", False)

    if suspicious_count >= 2:
        return {
            "context": "suspicious_history",
            "message": "This category has repeated suspicious feedback.",
            "keep_alert": True
        }

    if recurring_count >= 2:
        return {
            "context": "recurring_pattern",
            "message": "Similar spending has occurred repeatedly.",
            "keep_alert": True
        }

    if behavior_change and expected_count >= 2:
        return {
            "context": "possible_behavior_change",
            "message": "Previous feedback and a reported change may explain this activity.",
            "keep_alert": True
        }

    if history_months < 3:
        return {
            "context": "insufficient_context",
            "message": "There is not enough history to assess this activity.",
            "keep_alert": True
        }

    return {
        "context": "no_supporting_context",
        "message": "No reliable historical explanation was found.",
        "keep_alert": True
    }


if __name__ == "__main__":
    example = {
        "category": "Education",
        "recurring_pattern_count": 3,
        "history_months": 6
    }

    result = analyse_context(example)

    print("QORVILO CONTEXT ANALYSIS")
    print("=======================")
    print(f"Context: {result['context']}")
    print(f"Explanation: {result['message']}")
    print(f"Original alert retained: {result['keep_alert']}")
