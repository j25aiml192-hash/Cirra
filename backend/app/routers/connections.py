from typing import List
from fastapi import APIRouter, HTTPException, status
from app.schemas.connection import CreateConnectionRequest, ConnectionResponse

router = APIRouter(prefix="/connections", tags=["connections"])

# In-memory mock store for demo
_connections = [
    {
        "id": "c1111111-1111-1111-1111-111111111111",
        "tenant_id": "00000000-0000-0000-0000-000000000001",
        "name": "AWS Production Account",
        "provider": "aws",
        "status": "connected",
        "last_synced_at": "2024-10-20T10:00:00Z",
        "created_at": "2024-09-01T00:00:00Z"
    },
    {
        "id": "c2222222-2222-2222-2222-222222222222",
        "tenant_id": "00000000-0000-0000-0000-000000000001",
        "name": "OpenAI Organization",
        "provider": "openai",
        "status": "connected",
        "last_synced_at": "2024-10-20T11:30:00Z",
        "created_at": "2024-09-15T00:00:00Z"
    }
]

@router.get("", response_model=List[ConnectionResponse])
async def list_connections():
    return _connections

@router.post("", response_model=ConnectionResponse, status_code=status.HTTP_201_CREATED)
async def create_connection(payload: CreateConnectionRequest):
    new_conn = {
        "id": "c3333333-3333-3333-3333-333333333333",
        "tenant_id": "00000000-0000-0000-0000-000000000001",
        "name": payload.name,
        "provider": payload.provider,
        "status": "pending",
        "last_synced_at": None,
        "created_at": "2024-10-20T12:00:00Z"
    }
    _connections.append(new_conn)
    return new_conn

@router.get("/{connection_id}", response_model=ConnectionResponse)
async def get_connection(connection_id: str):
    for c in _connections:
        if c["id"] == connection_id:
            return c
    raise HTTPException(status_code=404, detail="Connection not found")

@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_connection(connection_id: str):
    global _connections
    _connections = [c for c in _connections if c["id"] != connection_id]
    return None
