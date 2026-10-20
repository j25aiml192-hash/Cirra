import os
import httpx
from src.detector import AnomalyCandidate


class AnomalyExplainer:
    """
    Plain-English Anomaly Explainer.
    CRITICAL ARCHITECTURAL CONSTRAINTS:
    - LLM explains only, NEVER detects!
    - LLM never invents numbers; numbers passed directly from statistical candidate.
    """

    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "")

    def explain(self, candidate: AnomalyCandidate) -> str:
        """
        Synthesize concise root cause explanation using verified metrics.
        """
        prompt = f"""
You are Cirra Sentinel FinOps assistant. Explain the following statistical cloud/AI spend anomaly in 1-2 clear, direct sentences for engineering leads:
- Resource / Series: {candidate.series_key}
- Baseline Spend: ${candidate.baseline_spend:.2f}
- Actual Current Spend: ${candidate.actual_spend:.2f}
- Spike: +{candidate.spike_percentage:.1f}%
- Severity: {candidate.severity} (MAD score: {candidate.mad_score})

Do not hallucinate any dollar amounts outside the ones listed above.
"""
        if not self.api_key:
            return (
                f"Sudden spend spike detected on {candidate.series_key}: spend jumped from "
                f"baseline ${candidate.baseline_spend:.2f} to ${candidate.actual_spend:.2f} "
                f"(+{candidate.spike_percentage:.1f}%), exceeding normal variance by {candidate.mad_score:.1f} MAD."
            )

        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [
                            {"role": "system", "content": "You are a concise FinOps telemetry analyst."},
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": 0.2,
                    },
                )
                if resp.status_code == 200:
                    return resp.json()["choices"][0]["message"]["content"].strip()
        except Exception:
            pass

        return (
            f"Spend on {candidate.series_key} increased by {candidate.spike_percentage:.1f}% "
            f"to ${candidate.actual_spend:.2f} against baseline ${candidate.baseline_spend:.2f}."
        )
