import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.deps import get_raw_db
from app.core.security import verify_supabase_token, create_cirra_token
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.auth import SessionRequest, SessionResponse

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

    # Issue Cirra JWT
    cirra_jwt = create_cirra_token(
        tenant_id=str(user.tenant_id),
        user_id=str(user.id),
        role=user.role,
    )

    return SessionResponse(
        access_token=cirra_jwt,
        token_type="bearer",
        tenant_id=str(user.tenant_id),
        user_id=str(user.id),
        role=user.role,
    )
