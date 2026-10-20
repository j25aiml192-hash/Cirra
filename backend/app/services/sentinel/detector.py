from typing import Any, Dict, Optional
import numpy as np


class AnomalyDetector:
    """
    ARIMA + MAD statistical anomaly detection.
    Zero LLM involved in anomaly detection.
    """

    def __init__(self, mad_threshold: float = 3.5):
        self.mad_threshold = mad_threshold

    def detect(self, series_key: str, current_value: float, historical_values: list) -> Optional[Dict[str, Any]]:
        if not historical_values or len(historical_values) < 5:
            return None

        arr = np.array(historical_values, dtype=float)
        median = float(np.median(arr))
        mad = float(np.median(np.abs(arr - median)))
        if mad == 0:
            mad = 1e-6

        mad_score = 0.6745 * (current_value - median) / mad
        if mad_score >= self.mad_threshold:
            spike_pct = ((current_value - median) / median) * 100
            return {
                "series_key": series_key,
                "baseline": round(median, 2),
                "actual": round(current_value, 2),
                "spike_percentage": round(spike_pct, 1),
                "severity": "critical" if mad_score > 6.0 else "warning",
            }
        return None
