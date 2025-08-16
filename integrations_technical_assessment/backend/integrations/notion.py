# notion.py

import json
import secrets
from fastapi import Request, HTTPException
from fastapi.responses import HTMLResponse
import httpx
import asyncio
import base64
import requests
from integrations.integration_item import IntegrationItem

from redis_client import add_key_value_redis, get_value_redis, delete_key_redis

# For Notion internal integrations, we use the integration token directly
# This is your internal integration secret that you pasted
INTEGRATION_TOKEN = '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'

# Internal integrations don't use OAuth - they use direct token access
# So we'll simulate the connection process

async def authorize_notion(user_id, org_id):
    # For internal integrations, we simulate the connection process
    # since we already have the token
    state_data = {
        'state': secrets.token_urlsafe(32),
        'user_id': user_id,
        'org_id': org_id
    }
    
    # Store the integration token directly (no OAuth needed)
    encoded_state = json.dumps(state_data)
    await add_key_value_redis(f'notion_state:{org_id}:{user_id}', encoded_state, expire=600)
    
    # Return a success message instead of OAuth URL
    return "Internal integration connected successfully"

async def oauth2callback_notion(request: Request):
    if request.query_params.get('error'):
        raise HTTPException(status_code=400, detail=request.query_params.get('error'))
    code = request.query_params.get('code')
    encoded_state = request.query_params.get('state')
    state_data = json.loads(encoded_state)

    original_state = state_data.get('state')
    user_id = state_data.get('user_id')
    org_id = state_data.get('org_id')

    saved_state = await get_value_redis(f'notion_state:{org_id}:{user_id}')

    if not saved_state or original_state != json.loads(saved_state).get('state'):
        raise HTTPException(status_code=400, detail='State does not match.')

    async with httpx.AsyncClient() as client:
        response, _ = await asyncio.gather(
            client.post(
                'https://api.notion.com/v1/oauth/token',
                json={
                    'grant_type': 'authorization_code',
                    'code': code,
                    'redirect_uri': REDIRECT_URI
                }, 
                headers={
                    'Authorization': f'Basic {encoded_client_id_secret}',
                    'Content-Type': 'application/json',
                }
            ),
            delete_key_redis(f'notion_state:{org_id}:{user_id}'),
        )

    await add_key_value_redis(f'notion_credentials:{org_id}:{user_id}', json.dumps(response.json()), expire=600)
    
    close_window_script = """
    <html>
        <script>
            window.close();
        </script>
    </html>
    """
    return HTMLResponse(content=close_window_script)

async def get_notion_credentials(user_id, org_id):
    # For internal integrations, we return the token directly
    # No need to check Redis since we have the token
    credentials = {
        'access_token': INTEGRATION_TOKEN,
        'token_type': 'Bearer',
        'integration_type': 'internal'
    }
    
    print(f"=== NOTION INTERNAL INTEGRATION CREDENTIALS ===")
    print(f"User ID: {user_id}")
    print(f"Org ID: {org_id}")
    print(f"Integration Token: {INTEGRATION_TOKEN[:20]}...")
    print(f"===============================================")
    
    return credentials

def _recursive_dict_search(data, target_key):
    """Recursively search for a key in a dictionary of dictionaries."""
    if target_key in data:
        return data[target_key]

    for value in data.values():
        if isinstance(value, dict):
            result = _recursive_dict_search(value, target_key)
            if result is not None:
                return result
        elif isinstance(value, list):
            for item in value:
                if isinstance(item, dict):
                    result = _recursive_dict_search(item, target_key)
                    if result is not None:
                        return result
    return None

def create_integration_item_metadata_object(
    response_json: dict,
) -> IntegrationItem:
    """creates an integration metadata object from the response using recursive search"""
    
    # Extract basic info
    item_id = response_json.get('id', 'unknown')
    item_type = response_json.get('object', 'unknown')
    
    # Use recursive search to find the best name from properties
    name = None
    
    # Priority 1: Look for 'title' property (most common for pages)
    if 'properties' in response_json:
        title_prop = _recursive_dict_search(response_json['properties'], 'title')
        if title_prop and 'title' in title_prop and title_prop['title']:
            name = title_prop['title'][0].get('plain_text', 'Untitled')
    
    # Priority 2: Look for 'Name' property
    if not name and 'properties' in response_json:
        name_prop = _recursive_dict_search(response_json['properties'], 'Name')
        if name_prop and 'title' in name_prop and name_prop['title']:
            name = name_prop['title'][0].get('plain_text', 'Untitled')
    
    # Priority 3: Look for any property with 'title' content
    if not name and 'properties' in response_json:
        for prop_name, prop_value in response_json['properties'].items():
            if isinstance(prop_value, dict) and 'title' in prop_value:
                title_content = prop_value['title']
                if title_content and len(title_content) > 0:
                    name = title_content[0].get('plain_text', 'Untitled')
                    break
    
    # Priority 4: Look for 'content' property (fallback)
    if not name:
        content_prop = _recursive_dict_search(response_json, 'content')
        if content_prop:
            name = str(content_prop)
    
    # Final fallback: use object type + ID
    if not name:
        name = f"{item_type.title()} {item_id[:8]}"
    
    # Extract parent info using recursive search
    parent_id = None
    parent_name = None
    if 'parent' in response_json:
        parent = response_json['parent']
        parent_type = parent.get('type', 'unknown')
        
        if parent_type != 'workspace':
            parent_id = parent.get(parent_type, None)
            parent_name = parent_type.title()
    
    # Extract timestamps
    creation_time = response_json.get('created_time', None)
    last_modified_time = response_json.get('last_edited_time', None)
    
    print(f"  Creating item: {item_type} - {name} (ID: {item_id})")
    
    integration_item_metadata = IntegrationItem(
        id=item_id,
        type=item_type.title(),  # Capitalize the type
        name=name,
        creation_time=creation_time,
        last_modified_time=last_modified_time,
        parent_id=parent_id,
        parent_path_or_name=parent_name
    )
    
    return integration_item_metadata

async def get_items_notion(credentials) -> list[IntegrationItem]:
    """Aggregates all metadata relevant for a notion integration"""
    try:
        # Parse credentials
        if isinstance(credentials, str):
            creds = json.loads(credentials)
        else:
            creds = credentials
        
        access_token = creds.get('access_token')
        if not access_token:
            print("❌ ERROR: No access token found in Notion credentials")
            raise HTTPException(status_code=400, detail='No access token found in Notion credentials')
        
        print(f"=== NOTION INTEGRATION STARTING ===")
        print(f"Access Token: {access_token[:20]}...")
        
        # Use the correct Notion API headers as per documentation
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
        }
        
        print("Searching Notion workspace...")
        response = requests.post(
            'https://api.notion.com/v1/search',
            headers=headers,
            json={
                'filter': {
                    'value': 'page',
                    'property': 'object'
                }
            }
        )
        
        if response.status_code != 200:
            print(f"❌ ERROR: Failed to search Notion workspace. Status: {response.status_code}")
            print(f"Response: {response.text}")
            raise HTTPException(status_code=400, detail=f'Failed to search Notion workspace: {response.status_code}')
        
        results = response.json().get('results', [])
        print(f"Found {len(results)} items in Notion workspace")
        
        list_of_integration_item_metadata = []
        for result in results:
            try:
                item = create_integration_item_metadata_object(result)
                list_of_integration_item_metadata.append(item)
                print(f"Processed item: {item.type} - {item.name}")
            except Exception as e:
                print(f"Warning: Failed to process item {result.get('id', 'unknown')}: {e}")
                continue
        
        print(f"=== NOTION INTEGRATION COMPLETED ===")
        print(f"Total items: {len(list_of_integration_item_metadata)}")
        print(f"Item types: {list(set([item.type for item in list_of_integration_item_metadata]))}")
        print(f"Full item list:")
        for i, item in enumerate(list_of_integration_item_metadata):
            print(f"  {i+1}. {item.type}: {item.name}")
        print(f"=====================================")
        
        # Convert IntegrationItem objects to dictionaries for JSON serialization
        print(f"Converting items to dictionaries for frontend...")
        dict_items = [item.__dict__ for item in list_of_integration_item_metadata]
        print(f"First item dict: {dict_items[0] if dict_items else 'None'}")
        
        return dict_items
        
    except Exception as e:
        print(f"❌ ERROR in Notion integration: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        print(f"Full error details: {e}")
        raise HTTPException(status_code=500, detail=f'Error in Notion integration: {str(e)}')
