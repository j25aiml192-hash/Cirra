from typing import Any, Dict, List, Optional, Tuple

MODEL_CATALOG: Dict[str, Dict[str, Dict[str, Any]]] = {
    "openai": {
        "gpt-4o": {
            "input_per_1m_tokens": 5.00,
            "output_per_1m_tokens": 15.00,
            "quality_tier": "premium",
            "best_for": ["complex reasoning", "code generation", "nuanced analysis"],
            "alternatives": ["gpt-4o-mini", "gemini-1.5-pro", "claude-3-5-sonnet"],
        },
        "gpt-4o-mini": {
            "input_per_1m_tokens": 0.15,
            "output_per_1m_tokens": 0.60,
            "quality_tier": "standard",
            "best_for": ["classification", "simple Q&A", "summarization"],
            "alternatives": ["gemini-1.5-flash", "groq/llama-3.1-8b-instant"],
        },
        "gpt-3.5-turbo": {
            "input_per_1m_tokens": 0.50,
            "output_per_1m_tokens": 1.50,
            "quality_tier": "standard",
            "best_for": ["simple tasks", "legacy integrations"],
            "alternatives": ["gpt-4o-mini", "gemini-1.5-flash"],
        },
    },
    "anthropic": {
        "claude-3-5-sonnet": {
            "input_per_1m_tokens": 3.00,
            "output_per_1m_tokens": 15.00,
            "quality_tier": "premium",
            "best_for": ["writing", "analysis", "coding"],
            "alternatives": ["claude-3-haiku", "gemini-1.5-pro"],
        },
        "claude-3-opus": {
            "input_per_1m_tokens": 15.00,
            "output_per_1m_tokens": 75.00,
            "quality_tier": "ultra",
            "best_for": ["complex tasks requiring best quality"],
            "alternatives": ["claude-3-5-sonnet", "gpt-4o"],
        },
        "claude-3-haiku": {
            "input_per_1m_tokens": 0.25,
            "output_per_1m_tokens": 1.25,
            "quality_tier": "fast",
            "best_for": ["high-volume simple tasks"],
            "alternatives": ["gemini-1.5-flash", "groq/llama-3.1-8b-instant"],
        },
    },
    "groq": {
        "llama-3.1-8b-instant": {
            "input_per_1m_tokens": 0.05,
            "output_per_1m_tokens": 0.08,
            "quality_tier": "fast",
            "best_for": ["high-speed inference", "simple classification"],
            "alternatives": [],  # already the cheapest
        },
        "llama-3.1-70b-versatile": {
            "input_per_1m_tokens": 0.59,
            "output_per_1m_tokens": 0.79,
            "quality_tier": "standard",
            "best_for": ["balanced quality and speed"],
            "alternatives": ["groq/llama-3.1-8b-instant", "gemini-1.5-flash"],
        },
    },
    "gemini": {
        "gemini-1.5-pro": {
            "input_per_1m_tokens": 1.25,
            "output_per_1m_tokens": 5.00,
            "quality_tier": "premium",
            "best_for": ["long context", "multimodal"],
            "alternatives": ["gemini-1.5-flash", "gpt-4o-mini"],
        },
        "gemini-1.5-flash": {
            "input_per_1m_tokens": 0.075,
            "output_per_1m_tokens": 0.30,
            "quality_tier": "fast",
            "best_for": ["high-volume tasks", "summarization"],
            "alternatives": ["groq/llama-3.1-8b-instant"],
        },
    },
}

# Alias mapping for models recorded under shortened or alternate names
MODEL_ALIASES: Dict[str, Tuple[str, str]] = {
    "llama-3.1-70b": ("groq", "llama-3.1-70b-versatile"),
    "llama-3.1-8b": ("groq", "llama-3.1-8b-instant"),
    "claude-3.5-sonnet": ("anthropic", "claude-3-5-sonnet"),
    "gpt-4": ("openai", "gpt-4o"),
    "gpt-4-turbo": ("openai", "gpt-4o"),
}

TIER_RANKS: Dict[str, int] = {
    "ultra": 4,
    "premium": 3,
    "standard": 2,
    "fast": 1,
}


def _resolve_model_provider(alt_str: str, default_provider: str = "openai") -> Tuple[str, str]:
    """Parse a model reference which may be 'provider/model' or just 'model'."""
    if "/" in alt_str:
        parts = alt_str.split("/", 1)
        return parts[0].strip().lower(), parts[1].strip()
    
    # Check alias
    if alt_str in MODEL_ALIASES:
        return MODEL_ALIASES[alt_str]

    # Check which provider owns this model
    for prov, models in MODEL_CATALOG.items():
        if alt_str in models:
            return prov, alt_str
        for m_name in models:
            if m_name.lower() == alt_str.lower():
                return prov, m_name

    return default_provider, alt_str


def get_model_info(provider: str, model: str) -> Optional[Dict[str, Any]]:
    p_lower = provider.lower().strip()
    m_clean = model.strip()

    # Check direct catalog hit
    prov_dict = MODEL_CATALOG.get(p_lower)
    if prov_dict and m_clean in prov_dict:
        return prov_dict[m_clean]

    # Check alias mapping
    if m_clean in MODEL_ALIASES:
        alias_p, alias_m = MODEL_ALIASES[m_clean]
        return MODEL_CATALOG.get(alias_p, {}).get(alias_m)

    # Partial / case-insensitive search in target provider
    if prov_dict:
        for m_key, m_val in prov_dict.items():
            if m_key.lower() == m_clean.lower() or m_clean.lower() in m_key.lower():
                return m_val

    # Global search across all providers
    for prov_name, models in MODEL_CATALOG.items():
        for m_key, m_val in models.items():
            if m_key.lower() == m_clean.lower() or m_clean.lower() in m_key.lower():
                return m_val

    return None


def get_cheaper_alternatives(provider: str, model: str) -> List[Dict[str, Any]]:
    """
    Returns list of cheaper alternatives with:
      provider, model, cost_reduction_pct, 
      quality_tier, quality_tier_change,
      trade_off_description
    """
    current_info = get_model_info(provider, model)
    if not current_info:
        return []

    cur_in = current_info["input_per_1m_tokens"]
    cur_out = current_info["output_per_1m_tokens"]
    cur_blended = 0.75 * cur_in + 0.25 * cur_out
    cur_tier = current_info.get("quality_tier", "standard")
    cur_rank = TIER_RANKS.get(cur_tier, 2)

    alternatives = current_info.get("alternatives", [])
    results: List[Dict[str, Any]] = []

    for alt_item in alternatives:
        alt_prov, alt_model = _resolve_model_provider(alt_item, default_provider=provider)
        alt_info = get_model_info(alt_prov, alt_model)
        if not alt_info:
            continue

        alt_in = alt_info["input_per_1m_tokens"]
        alt_out = alt_info["output_per_1m_tokens"]
        alt_blended = 0.75 * alt_in + 0.25 * alt_out

        if alt_blended < cur_blended:
            reduction_pct = round(((cur_blended - alt_blended) / cur_blended) * 100.0, 1)
            alt_tier = alt_info.get("quality_tier", "standard")
            alt_rank = TIER_RANKS.get(alt_tier, 2)

            if alt_rank == cur_rank:
                tier_change = "same"
                trade_off = f"Comparable {alt_tier} tier reasoning with {reduction_pct}% lower blended cost."
            elif alt_rank < cur_rank:
                tier_change = "downgrade"
                trade_off = f"Slight downgrade from {cur_tier} to {alt_tier}; ideal for classification, summarization, and high-volume pipelines."
            else:
                tier_change = "upgrade"
                trade_off = f"Upgraded to {alt_tier} with cost advantages."

            results.append({
                "provider": alt_prov,
                "model": alt_model,
                "cost_reduction_pct": reduction_pct,
                "quality_tier": alt_tier,
                "quality_tier_change": tier_change,
                "trade_off_description": trade_off,
            })

    # Sort by highest cost reduction percentage descending
    results.sort(key=lambda x: x["cost_reduction_pct"], reverse=True)
    return results

