from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime

class HubSpotWebhookEvent(BaseModel):
    """Model for HubSpot webhook events"""
    subscriptionType: str
    portalId: int
    objectId: int
    changeSource: str
    eventId: int
    appId: int
    occurredAt: int
    subscriptionId: int
    attemptNumber: int
    changeFlag: str
    sourceId: str
    objectType: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None
    additionalProperties: Optional[Dict[str, Any]] = None

class WebhookResponse(BaseModel):
    """Response model for webhook endpoint"""
    success: bool
    message: str
    event_id: Optional[int] = None
