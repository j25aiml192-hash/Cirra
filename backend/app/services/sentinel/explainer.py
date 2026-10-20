from typing import Any, Dict


class AnomalyExplainer:
    """
    LLM explains anomalies, never detects.
    Never invents cost numbers — only explains provided metrics.
    """

    def explain(self, anomaly_dict: Dict[str, Any]) -> str:
        series_key = anomaly_dict.get("series_key", "resource")
        baseline = anomaly_dict.get("baseline", 0.0)
        actual = anomaly_dict.get("actual", 0.0)
        spike = anomaly_dict.get("spike_percentage", 0.0)

        return (
            f"Spend on {series_key} jumped from baseline ${baseline:.2f} "
            f"to ${actual:.2f} (+{spike:.1f}%), exceeding normal variance."
        )
