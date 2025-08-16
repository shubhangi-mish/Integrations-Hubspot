# hubspot_config.py
# Configuration file for HubSpot OAuth 2.0 integration

# HubSpot OAuth 2.0 Configuration
# You need to create a HubSpot app at: https://developers.hubspot.com/docs/api/oauth-quickstart-guide

# Replace these with your actual HubSpot app credentials
HUBSPOT_CONFIG = {
    'CLIENT_ID': 'e8461765-70a1-441c-8988-48ef36e38323',
    'CLIENT_SECRET': '0c1feba1-9c54-4b17-b9cd-ef60398ff6a4',
    'REDIRECT_URI': 'http://localhost:8000/integrations/hubspot/oauth2callback',
    
    # HubSpot OAuth endpoints
    'AUTHORIZATION_URL': 'https://app-na2.hubspot.com/oauth/authorize',
    'TOKEN_URL': 'https://api.hubapi.com/oauth/v1/token',
    
    # Scopes for HubSpot API access (using proper HubSpot scope format)
    'SCOPES': [
        'crm.objects.contacts.write', 
        'timeline',
        'oauth',
        'crm.objects.contacts.read',
        'crm.objects.companies.read',
        'crm.objects.companies.write',
        'crm.objects.deals.write',
        'crm.objects.deals.read',
        'crm.objects.invoices.read',
        'crm.objects.invoices.write',
        'crm.objects.appointments.read',
        'crm.objects.appointments.write',
    ]
}

# Instructions to get HubSpot credentials:
# 1. Go to https://developers.hubspot.com/
# 2. Sign in to your HubSpot account
# 3. Go to "Developers" → "Apps"
# 4. Click "Create app"
# 5. Fill in app details
# 6. Go to "Auth" tab
# 7. Add redirect URI: http://localhost:8000/integrations/hubspot/oauth2callback
# 8. Copy Client ID and Client Secret
# 9. Update the values above
