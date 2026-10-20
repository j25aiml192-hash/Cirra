from typing import Optional
import redis.asyncio as aioredis
from app.core.config import settings

redis_pool: Optional[aioredis.Redis] = None


async def get_redis() -> aioredis.Redis:
    global redis_pool
    if redis_pool is None:
        redis_pool = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
    return redis_pool


async def close_redis() -> None:
    global redis_pool
    if redis_pool is not None:
        await redis_pool.close()
        redis_pool = None


async def check_redis_health() -> bool:
    try:
        r = await get_redis()
        res = await r.ping()
        return bool(res)
    except Exception:
        return False
