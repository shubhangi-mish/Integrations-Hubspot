import json
import asyncio
from datetime import datetime
from typing import List, Dict, Any
from models.webhook_models import HubSpotWebhookEvent
from redis_client import redis_client

class WebhookService:
    """Service to handle webhook events from HubSpot"""
    
    @staticmethod
    async def store_webhook_event(event: HubSpotWebhookEvent) -> bool:
        """Store webhook event in Redis"""
        try:
            # Convert event to dict for storage
            event_dict = event.dict()
            
            # Add timestamp
            event_dict['received_at'] = datetime.utcnow().isoformat()
            
            # Store in Redis with key pattern: webhook:events:{portal_id}:{event_id}
            key = f"webhook:events:{event.portalId}:{event.eventId}"
            
            # Store event data
            await redis_client.set(
                key,
                json.dumps(event_dict),
                ex=86400  # Expire in 24 hours
            )
            
            # Add to list of recent events for this portal
            list_key = f"webhook:recent_events:{event.portalId}"
            await redis_client.lpush(list_key, json.dumps(event_dict))
            
            # Keep only last 100 events
            await redis_client.ltrim(list_key, 0, 99)
            
            # Set expiration for the list
            await redis_client.expire(list_key, 86400)
            
            print(f"Stored webhook event: {event.eventId} for portal: {event.portalId}")
            return True
            
        except Exception as e:
            print(f"Error storing webhook event: {e}")
            return False
    
    @staticmethod
    async def get_recent_webhook_events(portal_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent webhook events for a portal"""
        try:
            list_key = f"webhook:recent_events:{portal_id}"
            events_data = await redis_client.lrange(list_key, 0, limit - 1)
            
            events = []
            for event_data in events_data:
                try:
                    event = json.loads(event_data)
                    events.append(event)
                except json.JSONDecodeError:
                    continue
            
            return events
            
        except Exception as e:
            print(f"Error retrieving webhook events: {e}")
            return []
    
    @staticmethod
    async def get_webhook_event(portal_id: int, event_id: int) -> Dict[str, Any]:
        """Get specific webhook event"""
        try:
            key = f"webhook:events:{portal_id}:{event_id}"
            event_data = await redis_client.get(key)
            
            if event_data:
                return json.loads(event_data)
            return {}
            
        except Exception as e:
            print(f"Error retrieving webhook event: {e}")
            return {}
    
    @staticmethod
    async def clear_webhook_events(portal_id: int) -> bool:
        """Clear all webhook events for a portal"""
        try:
            # Get all keys for this portal
            pattern = f"webhook:events:{portal_id}:*"
            keys = await redis_client.keys(pattern)
            
            # Delete individual events
            for key in keys:
                await redis_client.delete(key)
            
            # Delete recent events list
            list_key = f"webhook:recent_events:{portal_id}"
            await redis_client.delete(list_key)
            
            print(f"Cleared webhook events for portal: {portal_id}")
            return True
            
        except Exception as e:
            print(f"Error clearing webhook events: {e}")
            return False
