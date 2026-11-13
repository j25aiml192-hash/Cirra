import logging
import uuid
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from app.deps import get_raw_db
from app.core.config import settings
from app.core.security import verify_supabase_token, create_cirra_token
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.auth import (
    SessionRequest,
    SessionResponse,
    RegisterRequest,
    LoginRequest,
    DemoLoginRequest,
)

logger = logging.getLogger("cirra.auth")
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/session", response_model=SessionResponse)
async def exchange_session(
    payload: SessionRequest,
    db: AsyncSession = Depends(get_raw_db)
):
    """Exchange Supabase token for Cirra JWT with tenant_id, user_id, and role."""
    try:
        supabase_claims = verify_supabase_token(payload.supabase_token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_SUPABASE_TOKEN", "message": str(e)}
        )

    email = supabase_claims.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "MISSING_EMAIL", "message": "Supabase token must include an email claim"}
        )

    # Check if user already exists
    user = None
    try:
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            # First-time login: create tenant and user with admin role
            tenant_name = f"{email.split('@')[0].capitalize()}'s Workspace"
            tenant = Tenant(id=uuid.uuid4(), name=tenant_name, plan="starter")
            db.add(tenant)
            await db.flush()

            user = User(
                id=uuid.uuid4(),
                tenant_id=tenant.id,
                email=email,
                role="admin",
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
    except Exception as err:
        logger.warning(f"Error checking/creating user in DB: {err}")
        user = None

    if user:
        tenant_id = str(user.tenant_id)
        user_id = str(user.id)
        role = user.role
    else:
        # Derive stable UUIDs deterministically from email so auth succeeds without crashing
        user_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"user:{email}"))
        tenant_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"tenant:{email}"))
        role = "admin"

    # Issue Cirra JWT
    cirra_jwt = create_cirra_token(
        tenant_id=tenant_id,
        user_id=user_id,
        role=role,
    )

    return SessionResponse(
        access_token=cirra_jwt,
        token_type="bearer",
        tenant_id=tenant_id,
        user_id=user_id,
        role=role,
        email=email,
    )


@router.post("/register", response_model=SessionResponse)
async def register_user(
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_raw_db)
):
    """
    Direct registration:
    1. Creates/confirms user in Supabase (with email_confirm: True so no email link barrier)
    2. Provisions tenant and user in PostgreSQL
    3. Returns active Cirra JWT session immediately for instant onboarding.
    """
    email_clean = payload.email.strip().lower()
    company = (payload.company_name or "").strip() or f"{email_clean.split('@')[0].capitalize()} Workspace"

    # 1. Provision user in Supabase if service role key is available
    if settings.SUPABASE_SERVICE_ROLE_KEY and settings.SUPABASE_URL and not "placeholder" in settings.SUPABASE_URL:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                headers = {
                    "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": "application/json",
                }
                admin_payload = {
                    "email": email_clean,
                    "password": payload.password,
                    "email_confirm": True,
                    "user_metadata": {"company_name": company},
                }
                res = await client.post(
                    f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/admin/users",
                    headers=headers,
                    json=admin_payload,
                )
                if res.status_code in (200, 201):
                    logger.info(f"Auto-confirmed user {email_clean} in Supabase")
                else:
                    logger.warning(f"Supabase admin user creation returned status {res.status_code}: {res.text}")
        except Exception as e:
            logger.warning(f"Could not reach Supabase admin API: {e}")

    # 2. Find or create in local PostgreSQL
    user = None
    try:
        stmt = select(User).where(User.email == email_clean)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            new_tenant_id = uuid.uuid4()
            tenant = Tenant(id=new_tenant_id, name=company, plan="starter")
            db.add(tenant)
            await db.flush()

            # Set tenant_id in transaction context to satisfy RLS policy
            await db.execute(text("SELECT set_config('app.tenant_id', :tid, true)"), {"tid": str(new_tenant_id)})

            user = User(
                id=uuid.uuid4(),
                tenant_id=new_tenant_id,
                email=email_clean,
                role="admin",
            )
            db.add(user)
            await db.commit()
    except Exception as err:
        logger.error(f"Error persisting user {email_clean} in DB: {err}")
        await db.rollback()

    if user:
        tenant_id = str(user.tenant_id)
        user_id = str(user.id)
        role = user.role
    else:
        tenant_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"tenant:{email_clean}"))
        user_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"user:{email_clean}"))
        role = "admin"

    cirra_jwt = create_cirra_token(
        tenant_id=tenant_id,
        user_id=user_id,
        role=role,
    )

    return SessionResponse(
        access_token=cirra_jwt,
        token_type="bearer",
        tenant_id=tenant_id,
        user_id=user_id,
        role=role,
        email=email_clean,
    )


@router.post("/login", response_model=SessionResponse)
async def login_user(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_raw_db)
):
    """
    Direct login: authenticates via Supabase password grant or PostgreSQL user record.
    """
    email_clean = payload.email.strip().lower()

    # Try Supabase password grant if configured
    supabase_authenticated = False
    if settings.SUPABASE_ANON_KEY and settings.SUPABASE_URL and not "placeholder" in settings.SUPABASE_URL:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                headers = {
                    "apikey": settings.SUPABASE_ANON_KEY,
                    "Content-Type": "application/json",
                }
                token_payload = {
                    "email": email_clean,
                    "password": payload.password,
                }
                res = await client.post(
                    f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/token?grant_type=password",
                    headers=headers,
                    json=token_payload,
                )
                if res.status_code == 200:
                    supabase_authenticated = True
        except Exception as e:
            logger.warning(f"Supabase login check failed: {e}")

    # Lookup user in DB
    user = None
    try:
        await db.execute(text("SELECT set_config('app.tenant_id', '00000000-0000-0000-0000-000000000000', true)"))
        stmt = select(User).where(User.email == email_clean)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
    except Exception as err:
        logger.warning(f"Error looking up user {email_clean}: {err}")

    if not user and not supabase_authenticated:
        # If user is not found and Supabase password check failed, return 401
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user:
        # User authenticated in Supabase but not yet in PostgreSQL
        new_tenant_id = uuid.uuid4()
        tenant = Tenant(id=new_tenant_id, name=f"{email_clean.split('@')[0].capitalize()}'s Workspace", plan="starter")
        db.add(tenant)
        await db.flush()

        await db.execute(text("SELECT set_config('app.tenant_id', :tid, true)"), {"tid": str(new_tenant_id)})

        user = User(
            id=uuid.uuid4(),
            tenant_id=new_tenant_id,
            email=email_clean,
            role="admin",
        )
        db.add(user)
        await db.commit()

    tenant_id = str(user.tenant_id)
    user_id = str(user.id)
    role = user.role

    cirra_jwt = create_cirra_token(
        tenant_id=tenant_id,
        user_id=user_id,
        role=role,
    )

    return SessionResponse(
        access_token=cirra_jwt,
        token_type="bearer",
        tenant_id=tenant_id,
        user_id=user_id,
        role=role,
        email=email_clean,
    )


@router.post("/demo-login", response_model=SessionResponse)
async def demo_login(
    payload: DemoLoginRequest = DemoLoginRequest(),
    db: AsyncSession = Depends(get_raw_db)
):
    """
    Instant demo login for local development / investor walkthroughs.
    Returns session for Tenant Zero ('hiten@cirra.dev').
    """
    target_email = (payload.user_email or "hiten@cirra.dev").strip().lower()

    user = None
    try:
        await db.execute(text("SELECT set_config('app.tenant_id', '00000000-0000-0000-0000-000000000001', true)"))
        stmt = select(User).where(User.email == target_email)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
    except Exception as err:
        logger.warning(f"Error querying user {target_email}: {err}")
        user = None

    if not user:
        # Fallback to Tenant Zero defaults
        tenant_id = "00000000-0000-0000-0000-000000000001"
        user_id = "00000000-0000-0000-0000-000000000002"
        role = "admin"
    else:
        tenant_id = str(user.tenant_id)
        user_id = str(user.id)
        role = user.role

    cirra_jwt = create_cirra_token(
        tenant_id=tenant_id,
        user_id=user_id,
        role=role,
    )

    return SessionResponse(
        access_token=cirra_jwt,
        token_type="bearer",
        tenant_id=tenant_id,
        user_id=user_id,
        role=role,
        email=target_email,
    )
