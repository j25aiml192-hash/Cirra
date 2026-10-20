import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.deps import get_db_tenant_session, require_role, check_rate_limit
from app.models.user import User
from app.schemas.team import (
    TeamMemberResponse,
    InviteMemberRequest,
    UpdateRoleRequest,
)
from app.middleware.audit import log_audit_event

router = APIRouter(prefix="/team", tags=["team"])


@router.get("", response_model=List[TeamMemberResponse])
async def list_team_members(
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("viewer")),
    _: None = Depends(check_rate_limit),
):
    """List members of current tenant."""
    tenant_id = uuid.UUID(claims["tenant_id"])
    stmt = (
        select(User)
        .where(User.tenant_id == tenant_id)
        .order_by(User.created_at.asc())
    )
    result = await db.execute(stmt)
    users = result.scalars().all()

    return [
        TeamMemberResponse(
            id=str(u.id),
            tenant_id=str(u.tenant_id),
            email=u.email,
            role=u.role,
            created_at=u.created_at,
        )
        for u in users
    ]


@router.post("/invite", response_model=TeamMemberResponse, status_code=status.HTTP_201_CREATED)
async def invite_team_member(
    payload: InviteMemberRequest,
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("admin")),
    _: None = Depends(check_rate_limit),
):
    """Invite member to tenant (admin only)."""
    tenant_id = uuid.UUID(claims["tenant_id"])

    # Check if email is already member of this or another tenant
    stmt = select(User).where(User.email == payload.email)
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "USER_ALREADY_EXISTS", "message": "A user with this email already exists"}
        )

    new_user = User(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        email=payload.email,
        role=payload.role,
    )
    db.add(new_user)
    await db.flush()

    log_audit_event(
        action="team_member_invite",
        tenant_id=claims["tenant_id"],
        user_id=claims["user_id"],
        resource_type="user",
        resource_id=str(new_user.id),
        metadata={"email": new_user.email, "role": new_user.role},
    )

    return TeamMemberResponse(
        id=str(new_user.id),
        tenant_id=str(new_user.tenant_id),
        email=new_user.email,
        role=new_user.role,
        created_at=new_user.created_at,
    )


@router.patch("/{user_id}/role", response_model=TeamMemberResponse)
async def update_member_role(
    user_id: str,
    payload: UpdateRoleRequest,
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("admin")),
    _: None = Depends(check_rate_limit),
):
    """Update team member role (admin only). Prevents demoting the last admin."""
    try:
        target_uuid = uuid.UUID(user_id)
        tenant_id = uuid.UUID(claims["tenant_id"])
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_UUID", "message": "Invalid user ID"}
        )

    stmt = select(User).where(User.id == target_uuid, User.tenant_id == tenant_id)
    target_user = (await db.execute(stmt)).scalar_one_or_none()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found in this organization"}
        )

    # If demoting from admin, check if last admin
    if target_user.role == "admin" and payload.role != "admin":
        count_stmt = (
            select(func.count(User.id))
            .where(User.tenant_id == tenant_id, User.role == "admin")
        )
        admin_count = (await db.execute(count_stmt)).scalar() or 0
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "LAST_ADMIN", "message": "Cannot demote the last organization administrator"}
            )

    old_role = target_user.role
    target_user.role = payload.role

    log_audit_event(
        action="team_member_role_update",
        tenant_id=claims["tenant_id"],
        user_id=claims["user_id"],
        resource_type="user",
        resource_id=str(target_user.id),
        metadata={"old_role": old_role, "new_role": payload.role},
    )

    return TeamMemberResponse(
        id=str(target_user.id),
        tenant_id=str(target_user.tenant_id),
        email=target_user.email,
        role=target_user.role,
        created_at=target_user.created_at,
    )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_team_member(
    user_id: str,
    db: AsyncSession = Depends(get_db_tenant_session),
    claims: Dict[str, Any] = Depends(require_role("admin")),
    _: None = Depends(check_rate_limit),
):
    """Remove team member (admin only). Prevents removing the last admin."""
    try:
        target_uuid = uuid.UUID(user_id)
        tenant_id = uuid.UUID(claims["tenant_id"])
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_UUID", "message": "Invalid user ID"}
        )

    stmt = select(User).where(User.id == target_uuid, User.tenant_id == tenant_id)
    target_user = (await db.execute(stmt)).scalar_one_or_none()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found"}
        )

    if target_user.role == "admin":
        count_stmt = (
            select(func.count(User.id))
            .where(User.tenant_id == tenant_id, User.role == "admin")
        )
        admin_count = (await db.execute(count_stmt)).scalar() or 0
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "LAST_ADMIN", "message": "Cannot remove the last organization administrator"}
            )

    await db.delete(target_user)

    log_audit_event(
        action="team_member_remove",
        tenant_id=claims["tenant_id"],
        user_id=claims["user_id"],
        resource_type="user",
        resource_id=str(target_user.id),
        metadata={"email": target_user.email},
    )

    return None
