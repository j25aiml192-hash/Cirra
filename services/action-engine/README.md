# Cirra Action Engine

The **Cirra Action Engine** handles autonomous remediation workflows for cloud and AI spend anomalies:
- **Kill Switches**: Safely disables compromised or runaway API keys (OpenAI, Anthropic, Groq, Gemini). Never deletes keys or modifies code directly.
- **Spend Caps**: Proposes hard budget limit configurations via pull requests.
- **GitHub PR Generation**: Automatically opens remediation pull requests on `cirra-demo-infra` with markdown reports containing actionable engineering guidance.
- **Savings Ledger**: Tracks identified and verified cost savings with counterfactual and unit-cost calculations.
- **State Machine**: Enforces strict human approval before execution (`proposed -> dry_run -> approved -> executing -> executed -> verified`).

## Port & Protocol
Runs on port `8003` with FastAPI.
