from enum import Enum
from typing import Set


class CloudGroupBy(str, Enum):
    SERVICE = "service"
    PROVIDER = "provider"
    REGION = "region"
    TEAM = "team"
    ACCOUNT_ID = "account_id"


class CloudSortBy(str, Enum):
    SPEND = "spend"
    SERVICE = "service"
    REGION = "region"
    CHANGE = "change"
    PRIOR_PERIOD_SPEND = "prior_period_spend"


class AiGroupBy(str, Enum):
    MODEL = "model"
    PROVIDER = "provider"
    API_KEY_ID = "api_key_id"
    TEAM = "team"
    CUSTOMER = "customer"


class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"


class Period(str, Enum):
    P30D = "30d"
    P90D = "90d"
    P6M = "6m"
    P12M = "12m"


class MatchType(str, Enum):
    TAG = "tag"
    TAG_KEY_VALUE = "tag_key_value"
    PREFIX = "prefix"
    REGEX = "regex"
    NAME_REGEX = "name_regex"
    SERVICE = "service"
    ACCOUNT_ID = "account_id"


ALLOWED_CLOUD_GROUP_BY: Set[str] = {e.value for e in CloudGroupBy}
ALLOWED_CLOUD_SORT_BY: Set[str] = {e.value for e in CloudSortBy}
ALLOWED_AI_GROUP_BY: Set[str] = {e.value for e in AiGroupBy}
ALLOWED_SORT_ORDERS: Set[str] = {e.value for e in SortOrder}


def validate_cloud_group_by(val: str) -> str:
    if val not in ALLOWED_CLOUD_GROUP_BY:
        raise ValueError(f"Invalid cloud group_by '{val}'. Allowed values: {sorted(list(ALLOWED_CLOUD_GROUP_BY))}")
    return val


def validate_cloud_sort_by(val: str) -> str:
    if val not in ALLOWED_CLOUD_SORT_BY:
        raise ValueError(f"Invalid cloud sort_by '{val}'. Allowed values: {sorted(list(ALLOWED_CLOUD_SORT_BY))}")
    return val


def validate_ai_group_by(val: str) -> str:
    if val not in ALLOWED_AI_GROUP_BY:
        raise ValueError(f"Invalid AI group_by '{val}'. Allowed values: {sorted(list(ALLOWED_AI_GROUP_BY))}")
    return val
