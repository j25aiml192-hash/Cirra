import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timezone
import logging
import os
import time
from typing import Any, Dict, List, Optional
import httpx
from openai import AsyncOpenAI

from app.config import settings

logger = logging.getLogger("cirra.investigator.llm_router")

ROUTING_TABLE: Dict[str, Dict[str, Dict[str, str]]] = {
    "text_to_sql": {
        "primary": {
            "provider": "groq",
            "model": "llama-3.1-8b-instant",
            "reason": "lowest latency, most deterministic at temp=0",
        },
        "fallback_1": {
            "provider": "nvidia_nim",
            "model": "meta/llama-3.1-8b-instruct",
            "reason": "fast, good at structured output",
        },
        "fallback_2": {
            "provider": "gemini",
            "model": "gemini-1.5-flash",
            "reason": "reliable fallback",
        },
    },
    "anomaly_explanation": {
        "primary": {
            "provider": "gemini",
            "model": "gemini-1.5-flash",
            "reason": "best at natural language summaries",
        },
        "fallback_1": {
            "provider": "groq",
            "model": "llama-3.1-70b-versatile",
            "reason": "strong reasoning, fast",
        },
        "fallback_2": {
            "provider": "nvidia_nim",
            "model": "meta/llama-3.1-70b-instruct",
            "reason": "high quality output",
        },
    },
    "pr_body_generation": {
        "primary": {
            "provider": "nvidia_nim",
            "model": "meta/llama-3.1-70b-instruct",
            "reason": "excellent at markdown and code context",
        },
        "fallback_1": {
            "provider": "gemini",
            "model": "gemini-1.5-pro",
            "reason": "strong long-form generation",
        },
        "fallback_2": {
            "provider": "groq",
            "model": "llama-3.1-70b-versatile",
            "reason": "fast fallback",
        },
    },
    "call_script_generation": {
        "primary": {
            "provider": "groq",
            "model": "llama-3.1-8b-instant",
            "reason": "sub-second latency critical for voice",
        },
        "fallback_1": {
            "provider": "gemini",
            "model": "gemini-1.5-flash",
            "reason": "fast, reliable",
        },
        "fallback_2": {
            "provider": "nvidia_nim",
            "model": "meta/llama-3.1-8b-instruct",
            "reason": "fast structured output",
        },
    },
    "result_explanation": {
        "primary": {
            "provider": "groq",
            "model": "llama-3.1-8b-instant",
            "reason": "lowest latency for Ask Cirra chat responses",
        },
        "fallback_1": {
            "provider": "nvidia_nim",
            "model": "mistralai/mistral-7b-instruct-v0.3",
            "reason": "concise explanations",
        },
        "fallback_2": {
            "provider": "gemini",
            "model": "gemini-1.5-flash",
            "reason": "reliable fallback",
        },
    },
}

# Known internal provider fallback models when standard models are deprecated or restricted
PROVIDER_MODEL_FALLBACKS: Dict[str, List[str]] = {
    "groq": ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"],
    "gemini": ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro"],
    "nvidia_nim": [
        "meta/llama-3.1-8b-instruct",
        "mistralai/mistral-7b-instruct-v0.3",
        "meta/llama-3.1-70b-instruct",
    ],
}


@dataclass
class LLMResponse:
    content: str
    provider: str
    model: str
    latency_ms: float
    task_type: str
    is_fallback: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "content": self.content,
            "provider": self.provider,
            "model": self.model,
            "latency_ms": round(self.latency_ms, 2),
            "task_type": self.task_type,
            "is_fallback": self.is_fallback,
        }


@dataclass
class ProviderMetrics:
    total_calls: int = 0
    total_latency_ms: float = 0.0
    success_count: int = 0
    failure_count: int = 0
    consecutive_failures: int = 0
    status: str = "healthy"  # healthy, degraded, down
    last_latency_ms: Optional[float] = None
    last_checked_at: Optional[datetime] = None

    @property
    def avg_latency_ms(self) -> float:
        if self.success_count == 0:
            return 0.0
        return round(self.total_latency_ms / self.success_count, 2)

    def record_success(self, latency_ms: float):
        self.total_calls += 1
        self.success_count += 1
        self.consecutive_failures = 0
        self.status = "healthy"
        self.total_latency_ms += latency_ms
        self.last_latency_ms = round(latency_ms, 2)
        self.last_checked_at = datetime.now(timezone.utc)

    def record_failure(self):
        self.total_calls += 1
        self.failure_count += 1
        self.consecutive_failures += 1
        if self.consecutive_failures >= 3:
            self.status = "down"
        elif self.consecutive_failures >= 1:
            self.status = "degraded"
        self.last_checked_at = datetime.now(timezone.utc)


class ProviderClient:
    def __init__(self, provider: str):
        self.provider = provider
        self.base_url, self.api_key = self._resolve_credentials()

    def _resolve_credentials(self) -> tuple[str, Optional[str]]:
        if self.provider == "groq":
            return (
                getattr(settings, "GROQ_BASE_URL", "https://api.groq.com/openai/v1"),
                os.getenv("GROQ_API_KEY") or getattr(settings, "GROQ_API_KEY", None),
            )
        elif self.provider == "gemini":
            return (
                getattr(
                    settings,
                    "GEMINI_BASE_URL",
                    "https://generativelanguage.googleapis.com/v1beta/openai/",
                ),
                os.getenv("GEMINI_API_KEY")
                or os.getenv("GOOGLE_API_KEY")
                or getattr(settings, "GEMINI_API_KEY", None),
            )
        elif self.provider == "nvidia_nim":
            return (
                getattr(
                    settings,
                    "NVIDIA_NIM_BASE_URL",
                    "https://integrate.api.nvidia.com/v1",
                ),
                os.getenv("NVIDIA_NIM_API_KEY") or getattr(settings, "NVIDIA_NIM_API_KEY", None),
            )
        else:
            return ("https://api.openai.com/v1", os.getenv("OPENAI_API_KEY"))

    def is_configured(self) -> bool:
        _, key = self._resolve_credentials()
        return bool(key and not key.startswith("sk-placeholder") and "..." not in key)

    async def execute_chat(
        self,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 500,
        timeout: float = 12.0,
    ) -> tuple[str, str, float]:
        """
        Executes chat completion via AsyncOpenAI client.
        Tries requested model, and falls back to alternate models within provider if 404 occurs.
        """
        base_url, api_key = self._resolve_credentials()
        if not api_key:
            raise ValueError(f"Provider {self.provider} has no API key configured")

        models_to_try = [model]
        for fb in PROVIDER_MODEL_FALLBACKS.get(self.provider, []):
            if fb not in models_to_try:
                models_to_try.append(fb)

        last_err = None
        client = AsyncOpenAI(api_key=api_key, base_url=base_url, timeout=timeout)

        for m in models_to_try:
            try:
                t0 = time.time()
                resp = await client.chat.completions.create(
                    model=m,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                latency_ms = (time.time() - t0) * 1000.0
                content = (resp.choices[0].message.content or "").strip()
                return content, m, latency_ms
            except Exception as e:
                err_msg = str(e)
                last_err = e
                # If 404/not_found, decommissioned, or model doesn't exist, try next candidate model
                if (
                    "404" in err_msg
                    or "400" in err_msg
                    or "decommissioned" in err_msg.lower()
                    or "does not exist" in err_msg.lower()
                    or "not found" in err_msg.lower()
                    or "deprecated" in err_msg.lower()
                ):
                    logger.debug("Model %s unavailable on %s, trying next candidate: %s", m, self.provider, e)
                    continue
                # If auth failure, timeout or rate limit, re-raise to trigger provider-level fallback
                raise e

        raise last_err or RuntimeError(f"All model candidates failed on provider {self.provider}")


class ProviderHealthChecker:
    def __init__(self, clients: Dict[str, ProviderClient], metrics: Dict[str, ProviderMetrics]):
        self.clients = clients
        self.metrics = metrics
        self._running = False
        self._bg_task: Optional[asyncio.Task] = None

    async def check_provider(self, provider: str) -> bool:
        client = self.clients.get(provider)
        metric = self.metrics.get(provider)
        if not client or not metric:
            return False

        if not client.is_configured():
            metric.status = "down"
            metric.last_checked_at = datetime.now(timezone.utc)
            return False

        test_model = (
            "qwen/qwen3.8-27b"
            if provider == "groq"
            else ("gemini-1.5-flash" if provider == "gemini" else "meta/llama-3.1-8b-instruct")
        )
        try:
            _, _, latency = await client.execute_chat(
                model=test_model,
                messages=[{"role": "user", "content": "Reply with 'ok' and nothing else."}],
                temperature=0.0,
                max_tokens=5,
                timeout=5.0,
            )
            metric.record_success(latency)
            return True
        except Exception as exc:
            logger.warning("Health check failed for provider %s: %s", provider, exc)
            metric.record_failure()
            return False

    async def check_all(self) -> Dict[str, bool]:
        results = {}
        for provider in self.clients:
            results[provider] = await self.check_provider(provider)
        return results

    async def _loop(self):
        while self._running:
            try:
                await self.check_all()
            except Exception as e:
                logger.error("Error in ProviderHealthChecker loop: %s", e)
            await asyncio.sleep(300)  # check every 5 minutes

    def start(self):
        if not self._running:
            self._running = True
            try:
                self._bg_task = asyncio.create_task(self._loop())
            except RuntimeError:
                pass

    def stop(self):
        self._running = False
        if self._bg_task:
            self._bg_task.cancel()


class LLMRouter:
    def __init__(self):
        self.providers = ["groq", "gemini", "nvidia_nim"]
        self.clients = {p: ProviderClient(p) for p in self.providers}
        self.metrics = {p: ProviderMetrics() for p in self.providers}
        self.health_checker = ProviderHealthChecker(self.clients, self.metrics)

    def startup(self):
        self.health_checker.start()

    def shutdown(self):
        self.health_checker.stop()

    def get_status(self) -> Dict[str, Any]:
        return {
            "providers": {
                p: {
                    "configured": self.clients[p].is_configured(),
                    "status": self.metrics[p].status,
                    "available": self.metrics[p].status in ("healthy", "degraded") and self.clients[p].is_configured(),
                    "total_calls": self.metrics[p].total_calls,
                    "success_count": self.metrics[p].success_count,
                    "failure_count": self.metrics[p].failure_count,
                    "avg_latency_ms": self.metrics[p].avg_latency_ms,
                    "last_latency_ms": self.metrics[p].last_latency_ms,
                    "last_checked_at": (
                        self.metrics[p].last_checked_at.isoformat()
                        if self.metrics[p].last_checked_at
                        else None
                    ),
                }
                for p in self.providers
            },
            "routing_table": ROUTING_TABLE,
        }

    async def complete(
        self,
        task_type: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 500,
        force_provider: Optional[str] = None,
    ) -> LLMResponse:
        """
        Routes the task request according to ROUTING_TABLE with automatic multi-tier fallback.
        """
        if force_provider:
            if force_provider not in self.clients:
                raise ValueError(f"Unknown forced provider '{force_provider}'")
            target_provider = force_provider
            client = self.clients[target_provider]
            metric = self.metrics[target_provider]

            # Use primary model from task_type or default
            cfg = ROUTING_TABLE.get(task_type, {}).get("primary", {})
            model = cfg.get("model", "qwen/qwen3.8-27b" if target_provider == "groq" else "gemini-1.5-flash")

            try:
                content, used_model, latency = await client.execute_chat(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                metric.record_success(latency)
                return LLMResponse(
                    content=content,
                    provider=target_provider,
                    model=used_model,
                    latency_ms=latency,
                    task_type=task_type,
                    is_fallback=False,
                )
            except Exception as e:
                metric.record_failure()
                raise e

        route_spec = ROUTING_TABLE.get(task_type)
        if not route_spec:
            # Default to text_to_sql specification if unknown
            route_spec = ROUTING_TABLE["text_to_sql"]

        stages = [
            ("primary", route_spec["primary"], False),
            ("fallback_1", route_spec["fallback_1"], True),
            ("fallback_2", route_spec["fallback_2"], True),
        ]

        errors = []
        for stage_name, spec, is_fb in stages:
            provider = spec["provider"]
            model = spec["model"]
            client = self.clients.get(provider)
            metric = self.metrics.get(provider)

            if not client or not client.is_configured():
                logger.info("Skipping provider %s (not configured) for stage %s", provider, stage_name)
                continue

            # If marked down, skip unless all are down
            if metric.status == "down" and len(errors) < 2:
                logger.info("Skipping down provider %s for stage %s", provider, stage_name)
                continue

            try:
                logger.info(
                    "Attempting LLM completion: task=%s, provider=%s, model=%s (%s)",
                    task_type,
                    provider,
                    model,
                    stage_name,
                )
                content, used_model, latency = await client.execute_chat(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                metric.record_success(latency)
                return LLMResponse(
                    content=content,
                    provider=provider,
                    model=used_model,
                    latency_ms=latency,
                    task_type=task_type,
                    is_fallback=is_fb,
                )
            except Exception as exc:
                metric.record_failure()
                logger.warning(
                    "LLM stage %s on provider %s failed for task %s: %s",
                    stage_name,
                    provider,
                    task_type,
                    exc,
                )
                errors.append(f"{provider}: {exc}")

        # If all providers failed, raise RuntimeError with all failure reasons
        raise RuntimeError(f"All LLM providers failed for task {task_type}: {'; '.join(errors)}")


# Singleton instance
llm_router = LLMRouter()
