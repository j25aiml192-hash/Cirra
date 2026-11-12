from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class OnboardingStateResponse(BaseModel):
    id: str
    tenant_id: str
    current_step: int = 1
    completed_steps: List[int] = Field(default_factory=list)
    company_name: Optional[str] = None
    company_size: Optional[str] = None
    primary_use_case: Optional[str] = None
    step1_completed: bool = False
    step2_completed: bool = False
    step3_completed: bool = False
    step4_completed: bool = False
    wizard_completed: bool = False
    completed_at: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class Step1CompanyRequest(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=100, description="Company name")
    company_size: str = Field(..., description="startup | smb | enterprise")
    primary_use_case: str = Field(..., description="cost_control | security | both")


class ConnectionInput(BaseModel):
    provider: str = Field(..., description="Provider name e.g. openai, anthropic, groq")
    api_key: str = Field(..., min_length=1, description="API Key")
    label: Optional[str] = Field(None, description="Display label for this key")


class Step2ConnectRequest(BaseModel):
    connections: List[ConnectionInput] = Field(..., min_length=1, description="List of connections to register")


class Step2ConnectResponse(BaseModel):
    onboarding_state: Dict[str, Any]
    connections_created: int


class Step3ConfigureRequest(BaseModel):
    alert_phone: str = Field(..., description="E.164 phone number e.g. +14155552671")
    slack_webhook: Optional[str] = Field(None, description="Slack incoming webhook URL")
    ntfy_topic: Optional[str] = Field(None, description="ntfy topic URL")
    spend_cap_usd: Optional[float] = Field(None, description="Monthly spend cap in USD")
    quiet_hours_start: Optional[int] = Field(None, ge=0, le=23, description="Quiet hours start (0-23)")
    quiet_hours_end: Optional[int] = Field(None, ge=0, le=23, description="Quiet hours end (0-23)")


class Step4VerifyResponse(BaseModel):
    checks: List[Dict[str, Any]]
    all_critical_passed: bool
    can_proceed: bool


class CompleteWizardResponse(BaseModel):
    success: bool
    tenant_id: str
    dashboard_url: str = "/dashboard"
    message: str


class ResetWizardResponse(BaseModel):
    success: bool
    tenant_id: str
    message: str
    onboarding_state: Dict[str, Any]
