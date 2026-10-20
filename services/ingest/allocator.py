import re
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from decimal import Decimal
from sqlalchemy import text
from db import async_session

logger = logging.getLogger("cirra.ingest.allocator")

# Maximum regex length to prevent ReDoS
MAX_REGEX_LEN = 100
DANGEROUS_PATTERNS = [
    re.compile(r"\(.*\+.*\)\+"),
    re.compile(r"\(.*\*.*\)\*"),
    re.compile(r"\(\.\*\)\+"),
]


def validate_and_compile_regex(pattern: str) -> Optional[re.Pattern]:
    """Validate regex length and guard against catastrophic backtracking patterns."""
    if not pattern or len(pattern) > MAX_REGEX_LEN:
        logger.warning(f"Rejecting regex exceeding max length {MAX_REGEX_LEN}: {pattern[:20]}...")
        return None
    for dang in DANGEROUS_PATTERNS:
        if dang.search(pattern):
            logger.warning(f"Rejecting potentially catastrophic regex pattern: {pattern}")
            return None
    try:
        # Convert wildcards like "gke-*" to "gke-.*" if not already regex
        converted = pattern
        if "*" in pattern and ".*" not in pattern:
            converted = pattern.replace("*", ".*")
        return re.compile(converted, re.IGNORECASE)
    except re.error as e:
        logger.warning(f"Invalid regex '{pattern}': {e}")
        return None


async def get_tenant_rules(tenant_id: str) -> List[Dict[str, Any]]:
    """Fetch active allocation rules for tenant from Postgres, strictly ordered by priority ASC."""
    query = text("""
        SELECT id, priority, match_type, match_value, assign_team, assign_customer, assign_feature
        FROM allocation_rules
        WHERE tenant_id = :tenant_id
        ORDER BY priority ASC
    """)
    async with async_session() as session:
        result = await session.execute(query, {"tenant_id": tenant_id})
        rows = result.fetchall()
        return [
            {
                "id": str(r[0]),
                "priority": r[1],
                "match_type": r[2].lower(),
                "match_value": r[3],
                "assign_team": r[4],
                "assign_customer": r[5],
                "assign_feature": r[6],
            }
            for r in rows
        ]


def match_rule_against_fact(rule: Dict[str, Any], fact: Dict[str, Any]) -> bool:
    """Evaluate whether an allocation rule matches a cost fact."""
    m_type = rule["match_type"]
    m_val = rule["match_value"]
    tags = fact.get("tags", {}) or {}
    resource_id = fact.get("resource_id", "")
    service_name = fact.get("service_name", "")

    if m_type in ("tag", "tag_key_value"):
        if "=" in m_val:
            k, v = m_val.split("=", 1)
            return tags.get(k.strip()) == v.strip()
        return m_val.strip() in tags

    if m_type in ("account_id", "account"):
        return tags.get("account_id") == m_val.strip()

    if m_type in ("service", "service_name"):
        return m_val.lower() in service_name.lower()

    if m_type in ("regex", "name_regex", "prefix"):
        rgx = validate_and_compile_regex(m_val)
        if rgx and rgx.search(resource_id):
            return True
        return False

    return False


def allocate_fact(fact: Dict[str, Any], rules: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Apply allocation precedence hierarchy to a single cost fact:
    1. Manual allocation (allocation_method == 'manual') -> NEVER overwritten.
    2. Explicit tag -> If 'team' or 'customer' already explicitly tagged on resource.
    3. Rules ordered by priority (tag_key_value -> account_id -> name_regex -> service).
    4. Fallback -> unallocated.
    """
    current_method = fact.get("allocation_method", "unallocated")
    if current_method == "manual":
        # Never overwrite manual allocations
        return fact

    tags = dict(fact.get("tags", {}) or {})

    # Precedence 1: Explicit tag on resource
    if tags.get("team") or tags.get("customer"):
        fact["allocation_method"] = "tag"
        return fact

    # Precedence 2: Match rules in priority order
    for rule in rules:
        if match_rule_against_fact(rule, fact):
            fact["allocation_method"] = "rule"
            if rule.get("assign_team"):
                tags["team"] = rule["assign_team"]
            if rule.get("assign_customer"):
                tags["customer"] = rule["assign_customer"]
            if rule.get("assign_feature"):
                tags["feature"] = rule["assign_feature"]
            fact["tags"] = tags
            return fact

    # Precedence 3: Unallocated fallback
    fact["allocation_method"] = "unallocated"
    return fact


def allocate_facts_inline(facts: List[Any], rules: List[Dict[str, Any]]) -> List[Any]:
    """Allocate fresh facts inline during ingest."""
    if not rules:
        return facts

    for f in facts:
        f_dict = f.model_dump() if hasattr(f, "model_dump") else f
        allocate_fact(f_dict, rules)
        if hasattr(f, "allocation_method"):
            f.allocation_method = f_dict["allocation_method"]
            f.tags = f_dict["tags"]
    return facts
