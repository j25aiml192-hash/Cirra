from typing import List
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/settings", tags=["settings"])

class TeamMember(BaseModel):
    id: str
    email: str
    role: str
    status: str

class InviteMemberRequest(BaseModel):
    email: str
    role: str = "viewer"

_team_members = [
    {
        "id": "u1111111-1111-1111-1111-111111111111",
        "email": "admin@cirra.dev",
        "role": "owner",
        "status": "active"
    },
    {
        "id": "u2222222-2222-2222-2222-222222222222",
        "email": "devops-lead@cirra.dev",
        "role": "admin",
        "status": "active"
    }
]

@router.get("/team", response_model=List[TeamMember])
async def list_team_members():
    return _team_members

@router.post("/team", response_model=TeamMember, status_code=status.HTTP_201_CREATED)
async def invite_team_member(payload: InviteMemberRequest):
    new_member = {
        "id": f"u{len(_team_members)+1}111111-1111-1111-1111-111111111111",
        "email": payload.email,
        "role": payload.role,
        "status": "invited"
    }
    _team_members.append(new_member)
    return new_member

@router.delete("/team/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_team_member(member_id: str):
    global _team_members
    _team_members = [m for m in _team_members if m["id"] != member_id]
    return None
