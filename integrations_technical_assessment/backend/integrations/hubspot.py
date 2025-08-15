# hubspot.py

import datetime
import json
import secrets
import os
from fastapi import Request, HTTPException
from fastapi.responses import HTMLResponse
import httpx
import asyncio
import base64
import hashlib

import requests
from integrations.integration_item import IntegrationItem

from redis_client import add_key_value_redis, get_value_redis, delete_key_redis

# Import HubSpot configuration
from hubspot_config import HUBSPOT_CONFIG

# HubSpot OAuth 2.0 Configuration
CLIENT_ID = HUBSPOT_CONFIG['CLIENT_ID']
CLIENT_SECRET = HUBSPOT_CONFIG['CLIENT_SECRET']
REDIRECT_URI = HUBSPOT_CONFIG['REDIRECT_URI']

# HubSpot OAuth endpoints
AUTHORIZATION_URL = HUBSPOT_CONFIG['AUTHORIZATION_URL']
TOKEN_URL = HUBSPOT_CONFIG['TOKEN_URL']

# Scopes for HubSpot API access
SCOPES = HUBSPOT_CONFIG['SCOPES']

def save_tokens_to_json(user_id, org_id, token_data):
    """
    Save OAuth tokens to a JSON file for persistence
    """
    try:
        # Create tokens directory if it doesn't exist
        tokens_dir = "tokens"
        if not os.path.exists(tokens_dir):
            os.makedirs(tokens_dir)
        
        # Create filename with user and org info
        filename = f"{tokens_dir}/hubspot_tokens_{org_id}_{user_id}.json"
        
        # Add metadata to the token data
        token_data_with_metadata = {
            "user_id": user_id,
            "org_id": org_id,
            "integration": "HubSpot",
            "created_at": datetime.datetime.now().isoformat(),
            "tokens": token_data
        }
        
        # Save to JSON file
        with open(filename, 'w') as f:
            json.dump(token_data_with_metadata, f, indent=2)
        
        print(f"Tokens saved to {filename}")
        return filename
        
    except Exception as e:
        print(f"Error saving tokens to JSON: {str(e)}")
        return None

def load_tokens_from_json(user_id, org_id):
    """
    Load OAuth tokens from JSON file
    """
    try:
        filename = f"tokens/hubspot_tokens_{org_id}_{user_id}.json"
        if os.path.exists(filename):
            with open(filename, 'r') as f:
                token_data = json.load(f)
            print(f"Tokens loaded from {filename}")
            return token_data.get('tokens')
        else:
            print(f"Token file not found: {filename}")
            return None
    except Exception as e:
        print(f"Error loading tokens from JSON: {str(e)}")
        return None

async def authorize_hubspot(user_id, org_id):
    """
    Start HubSpot OAuth 2.0 flow with PKCE
    """
    # Generate PKCE parameters
    code_verifier = secrets.token_urlsafe(32)
    m = hashlib.sha256()
    m.update(code_verifier.encode('utf-8'))
    code_challenge = base64.urlsafe_b64encode(m.digest()).decode('utf-8').replace('=', '')
    
    # Generate state for security
    state_data = {
        'state': secrets.token_urlsafe(32),
        'user_id': user_id,
        'org_id': org_id
    }
    encoded_state = base64.urlsafe_b64encode(json.dumps(state_data).encode('utf-8')).decode('utf-8')
    
    # Build authorization URL
    scope_string = ' '.join(SCOPES)
    auth_url = f'{AUTHORIZATION_URL}?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&scope={scope_string}&state={encoded_state}&code_challenge={code_challenge}&code_challenge_method=S256'
    
    # Store state and code verifier in Redis with expiration
    await asyncio.gather(
        add_key_value_redis(f'hubspot_state:{org_id}:{user_id}', json.dumps(state_data), expire=600),
        add_key_value_redis(f'hubspot_verifier:{org_id}:{user_id}', code_verifier, expire=600),
    )
    print("state_data", state_data)
    print("code_verifier", code_verifier)
    print("code_challenge", code_challenge)
    return auth_url

async def oauth2callback_hubspot(request: Request):
    """
    Handle HubSpot OAuth callback and exchange code for tokens
    """
    # Check for OAuth errors
    if request.query_params.get('error'):
        raise HTTPException(status_code=400, detail=request.query_params.get('error_description'))
    
    # Extract OAuth parameters
    code = request.query_params.get('code')
    encoded_state = request.query_params.get('state')
    
    if not code or not encoded_state:
        raise HTTPException(status_code=400, detail='Missing required OAuth parameters')
    
    try:
        state_data = json.loads(base64.urlsafe_b64decode(encoded_state).decode('utf-8'))
    except Exception:
        raise HTTPException(status_code=400, detail='Invalid state parameter')
    
    original_state = state_data.get('state')
    user_id = state_data.get('user_id')
    org_id = state_data.get('org_id')
    
    # Retrieve stored state and code verifier from Redis
    saved_state, code_verifier = await asyncio.gather(
        get_value_redis(f'hubspot_state:{org_id}:{user_id}'),
        get_value_redis(f'hubspot_verifier:{org_id}:{user_id}'),
    )
    
    if not saved_state or not code_verifier:
        raise HTTPException(status_code=400, detail='OAuth state expired or invalid')
    
    # Verify state parameter
    if original_state != json.loads(saved_state.decode('utf-8')).get('state'):
        raise HTTPException(status_code=400, detail='State parameter mismatch')
    
    # Exchange authorization code for access token
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            TOKEN_URL,
            data={
                'grant_type': 'authorization_code',
                'client_id': CLIENT_ID,
                'client_secret': CLIENT_SECRET,
                'redirect_uri': REDIRECT_URI,
                'code': code,
                'code_verifier': code_verifier.decode('utf-8'),
            },
            headers={
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        )
        
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail='Failed to exchange code for token')
        
        token_data = token_response.json()
    
    # Save tokens to JSON file for persistence
    json_filename = save_tokens_to_json(user_id, org_id, token_data)
    if json_filename:
        print(f"OAuth tokens saved to: {json_filename}")
    
    # Store credentials in Redis with expiration (for immediate use)
    await add_key_value_redis(
        f'hubspot_credentials:{org_id}:{user_id}', 
        json.dumps(token_data), 
        expire=3600  # 1 hour expiration
    )
    
    # Clean up OAuth state data
    await asyncio.gather(
        delete_key_redis(f'hubspot_state:{org_id}:{user_id}'),
        delete_key_redis(f'hubspot_verifier:{org_id}:{user_id}'),
    )
    
    # Return HTML to close the popup window
    close_window_script = """
    <html>
        <script>
            window.close();
        </script>
    </html>
    """
    print("user_id", user_id)
    print("org_id", org_id)
    print("Token data received:", token_data)
    return HTMLResponse(content=close_window_script)

async def get_hubspot_credentials(user_id, org_id):
    """
    Retrieve stored HubSpot credentials from Redis
    """
    credentials = await get_value_redis(f'hubspot_credentials:{org_id}:{user_id}')
    if not credentials:
        raise HTTPException(status_code=400, detail='No credentials found.')
    
    credentials = json.loads(credentials.decode('utf-8'))
    print("credentials", credentials)
    # Delete credentials from Redis after retrieval (security best practice)
    await delete_key_redis(f'hubspot_credentials:{org_id}:{user_id}')
    
    return credentials


def create_integration_item_metadata_object(
    contact_data: dict
) -> IntegrationItem:
    """Creates an IntegrationItem from HubSpot contact data"""
    # Create contact name from first and last name
    contact_name = f"{contact_data.get('properties', {}).get('firstname', '')} {contact_data.get('properties', {}).get('lastname', '')}".strip()
    if not contact_name:
        contact_name = contact_data.get('properties', {}).get('email', 'Unknown Contact')
    
    integration_item_metadata = IntegrationItem(
        id=contact_data.get('id'),
        type='Contact',
        name=contact_name,
        creation_time=contact_data.get('createdAt'),
        last_modified_time=contact_data.get('updatedAt'),
        url=f"https://app.hubspot.com/contacts/{contact_data.get('id')}"
    )

    return integration_item_metadata


async def get_items_hubspot(credentials) -> list[IntegrationItem]:
    """
    Fetch data from HubSpot using stored credentials
    """
    if not credentials:
        raise HTTPException(status_code=400, detail='No credentials provided')
    
    try:
        # Parse credentials
        if isinstance(credentials, str):
            creds = json.loads(credentials)
        else:
            creds = credentials
        
        access_token = creds.get('access_token')
        if not access_token:
            raise HTTPException(status_code=400, detail='No access token found')
        
        async with httpx.AsyncClient() as client:
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Get contacts
            contacts_response = await client.get(
                'https://api.hubapi.com/crm/v3/objects/contacts',
                headers=headers,
                params={'limit': 100}
            )
            
            if contacts_response.status_code != 200:
                raise HTTPException(status_code=400, detail='Failed to fetch HubSpot contacts')
            
            contacts_data = contacts_response.json()
            
            # Create integration items
            items = []
            
            # Process contacts using helper function
            for contact in contacts_data.get('results', []):
                items.append(create_integration_item_metadata_object(contact))
            
            print(f'list_of_integration_item_metadata: {items}')
            # Convert IntegrationItem objects to dictionaries for JSON serialization
            return [item.__dict__ for item in items]
            
    except Exception as e:
        print(f'Error fetching HubSpot data: {str(e)}')
        raise HTTPException(status_code=500, detail=f'Error fetching HubSpot data: {str(e)}')

