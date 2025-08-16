// hubspot.js

import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Typography,
    Alert
} from '@mui/material';
import axios from 'axios';

export const HubSpotIntegration = ({ user, org, integrationParams, setIntegrationParams }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [eventMessage, setEventMessage] = useState('');
    const [isLoadingObjects, setIsLoadingObjects] = useState(false);
    const [objects, setObjects] = useState([]);
    const [savedTokens, setSavedTokens] = useState(null);
    const [isLoadingTokens, setIsLoadingTokens] = useState(false);
    const [webhookEvents, setWebhookEvents] = useState([]);
    const [isLoadingWebhooks, setIsLoadingWebhooks] = useState(false);

    // Function to open OAuth in a new window
    const handleConnectClick = async () => {
        try {
            setIsConnecting(true);
            const formData = new FormData();
            formData.append('user_id', user);
            formData.append('org_id', org);
            const response = await axios.post(`http://localhost:8000/integrations/hubspot/authorize`, formData);
            const authURL = response?.data;

            const newWindow = window.open(authURL, 'HubSpot Authorization', 'width=600, height=600');

            // Polling for the window to close
            const pollTimer = window.setInterval(() => {
                if (newWindow?.closed !== false) { 
                    window.clearInterval(pollTimer);
                    handleWindowClosed();
                }
            }, 200);
        } catch (e) {
            setIsConnecting(false);
            alert(e?.response?.data?.detail);
        }
    }

    // Function to handle logic when the OAuth window closes
    const handleWindowClosed = async () => {
        try {
            const formData = new FormData();
            formData.append('user_id', user);
            formData.append('org_id', org);
            const response = await axios.post(`http://localhost:8000/integrations/hubspot/credentials`, formData);
            const credentials = response.data; 
            if (credentials) {
                setIsConnecting(false);
                setIsConnected(true);
                // Update integration params with HubSpot connection info
                setIntegrationParams({
                    type: 'HubSpot',
                    credentials: credentials,
                    connected: true,
                    portalId: credentials.portal_id || 243587445, // Use actual HubSpot portal ID
                    connectedAt: new Date().toISOString()
                });
            } else {
                setIsConnecting(false);
                setIsConnected(false);
            }
        } catch (e) {
            setIsConnecting(false);
            setIsConnected(false);
            alert(e?.response?.data?.detail);
        }
    }

    useEffect(() => {
        // Check if HubSpot is connected based on integration params
        if (integrationParams?.type === 'HubSpot' && integrationParams?.connected) {
            setIsConnected(true);
        } else {
            setIsConnected(false);
        }
    }, [integrationParams]);

    // Function to load existing objects from HubSpot
    const handleLoadObjects = async () => {
        try {
            setIsLoadingObjects(true);
            setEventMessage('');
            
            const formData = new FormData();
            formData.append('credentials', JSON.stringify(integrationParams.credentials));
            
            const response = await axios.post(`http://localhost:8000/integrations/hubspot/load`, formData);
            
            console.log('HubSpot response data:', response.data);
            if (response.data && Array.isArray(response.data)) {
                console.log('Setting objects:', response.data);
                setObjects(response.data);
                
                // Count all different object types dynamically
                const objectCounts = {};
                response.data.forEach(obj => {
                    const type = obj.type;
                    objectCounts[type] = (objectCounts[type] || 0) + 1;
                });
                
                // Build dynamic message
                const types = Object.keys(objectCounts);
                let message = 'Loaded ';
                
                if (types.length === 1) {
                    const type = types[0];
                    const count = objectCounts[type];
                    message += `${count} ${type.toLowerCase()}${count > 1 ? 's' : ''}`;
                } else if (types.length === 2) {
                    const type1 = types[0];
                    const type2 = types[1];
                    const count1 = objectCounts[type1];
                    const count2 = objectCounts[type2];
                    message += `${count1} ${type1.toLowerCase()}${count1 > 1 ? 's' : ''} and ${count2} ${type2.toLowerCase()}${count2 > 1 ? 's' : ''}`;
                } else {
                    // For 3+ types, show first few with "and X more"
                    const firstTypes = types.slice(0, 2);
                    const remainingTypes = types.slice(2);
                    
                    const firstPart = firstTypes.map(type => {
                        const count = objectCounts[type];
                        return `${count} ${type.toLowerCase()}${count > 1 ? 's' : ''}`;
                    }).join(' and ');
                    
                    const remainingCount = remainingTypes.reduce((total, type) => total + objectCounts[type], 0);
                    message += `${firstPart} and ${remainingCount} more`;
                }
                
                message += ' from HubSpot';
                setEventMessage(message);
            } else {
                setEventMessage('No data received from HubSpot');
            }
        } catch (e) {
            setEventMessage(`Error loading HubSpot data: ${e?.response?.data?.detail || e.message}`);
        } finally {
            setIsLoadingObjects(false);
        }
    };

    // Function to load saved tokens from JSON file
    const handleLoadSavedTokens = async () => {
        try {
            setIsLoadingTokens(true);
            setEventMessage('');
            
            const response = await axios.get(`http://localhost:8000/integrations/hubspot/tokens/${org}/${user}`);
            
            if (response.data && response.data.tokens) {
                setSavedTokens(response.data.tokens);
                setEventMessage('Saved tokens loaded successfully!');
            }
        } catch (e) {
            setEventMessage(`Error loading saved tokens: ${e?.response?.data?.detail || e.message}`);
        } finally {
            setIsLoadingTokens(false);
        }
    };

    const handleLoadWebhookEvents = async () => {
        setIsLoadingWebhooks(true);
        try {
            // Get portal ID from saved tokens or use the actual portal ID from HubSpot
            let portalId = 243587445; // Use the actual portal ID from your logs
            
            if (savedTokens && savedTokens.portal_id) {
                portalId = savedTokens.portal_id;
            } else if (integrationParams?.portalId) {
                portalId = integrationParams.portalId;
            }
            
            console.log('Loading webhook events for portal ID:', portalId);
            
            const response = await axios.get(`http://localhost:8000/webhooks/hubspot/events/${portalId}`);
            console.log('Webhook response:', response.data);
            
            if (response.data.success) {
                setWebhookEvents(response.data.events);
                setEventMessage(`Loaded ${response.data.count} webhook events`);
            } else {
                setEventMessage('No webhook events found or error occurred');
            }
        } catch (error) {
            console.error('Error loading webhook events:', error);
            setEventMessage(`Error loading webhook events: ${error.message}`);
        } finally {
            setIsLoadingWebhooks(false);
        }
    };

    const handleClearWebhookEvents = async () => {
        try {
            const portalId = integrationParams?.portalId || 243587445;
            await axios.delete(`http://localhost:8000/webhooks/hubspot/events/${portalId}`);
            setWebhookEvents([]);
        } catch (error) {
            console.error('Error clearing webhook events:', error);
        }
    };

    return (
        <>
        <Box sx={{mt: 2}}>
            <Typography variant="h6" gutterBottom>
                HubSpot Integration
            </Typography>
            
            <Box display='flex' alignItems='center' justifyContent='center' sx={{mt: 2}}>
                <Button 
                    variant='contained' 
                    onClick={isConnected ? () => {} : handleConnectClick}
                    color={isConnected ? 'success' : 'primary'}
                    disabled={isConnecting}
                    style={{
                        pointerEvents: isConnected ? 'none' : 'auto',
                        cursor: isConnected ? 'default' : 'pointer',
                        opacity: isConnected ? 1 : undefined
                    }}
                >
                    {isConnected ? 'HubSpot Connected' : isConnecting ? <CircularProgress size={20} /> : 'Connect to HubSpot'}
                </Button>
            </Box>

            {isConnected && (
                <Box sx={{mt: 3}}>
                    <Typography variant="h6" gutterBottom>
                        HubSpot Data
                    </Typography>
                    
                    {/* Connection Status */}
                    <Box sx={{mb: 2, p: 2, border: '1px solid #4caf50', borderRadius: 1, bgcolor: '#e8f5e8'}}>
                        <Typography variant="subtitle2" color="#2e7d32" gutterBottom>
                            ✓ HubSpot Connected
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Portal ID:</strong> {integrationParams?.portalId || 'N/A'} | 
                            <strong>Connected:</strong> {integrationParams?.connectedAt ? new Date(integrationParams.connectedAt).toLocaleString() : 'N/A'}
                        </Typography>
                    </Box>
                    
                    {eventMessage && (
                        <Alert severity={eventMessage.includes('Error') ? 'error' : 'success'} sx={{mb: 2}}>
                            {eventMessage}
                        </Alert>
                    )}
                    
                    <Box sx={{mb: 2}}>
                        <Box sx={{display: 'flex', gap: 2, mb: 2}}>
                            <Button
                                variant="outlined"
                                onClick={handleLoadObjects}
                                disabled={isLoadingObjects}
                            >
                                {isLoadingObjects ? <CircularProgress size={20} /> : 'Load HubSpot Data'}
                            </Button>
                            
                            <Button
                                variant="outlined"
                                onClick={handleLoadSavedTokens}
                                disabled={isLoadingTokens}
                            >
                                {isLoadingTokens ? <CircularProgress size={20} /> : 'Load Saved Tokens'}
                            </Button>
                        </Box>
                        
                        {savedTokens && (
                            <Box sx={{mt: 2, p: 2, border: '1px solid #ccc', borderRadius: 1, bgcolor: '#f9f9f9'}}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Saved OAuth Tokens:
                                </Typography>
                                <Box sx={{fontFamily: 'monospace', fontSize: '0.8rem'}}>
                                    <div><strong>Access Token:</strong> {savedTokens.access_token?.substring(0, 50)}...</div>
                                    <div><strong>Refresh Token:</strong> {savedTokens.refresh_token?.substring(0, 50)}...</div>
                                    <div><strong>Expires In:</strong> {savedTokens.expires_in} seconds</div>
                                    <div><strong>Token Type:</strong> {savedTokens.token_type}</div>
                                </Box>
                            </Box>
                        )}
                        
                        {objects.length > 0 && (
                            <Box sx={{mt: 2}}>
                                {/* Contacts Section */}
                                {objects.filter(obj => obj.type === 'Contact').length > 0 && (
                                    <Box sx={{mb: 3}}>
                                        <Typography variant="h6" gutterBottom>
                                            HubSpot Contacts ({objects.filter(obj => obj.type === 'Contact').length})
                                        </Typography>
                                        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                                            {objects.filter(obj => obj.type === 'Contact').map((contact, index) => (
                                                <Box key={`contact-${index}`} sx={{p: 3, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#fafafa', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
                                                    <Typography variant="h6" sx={{fontWeight: 'bold', color: '#1976d2', mb: 1}}>
                                                        {contact.name}
                                                    </Typography>
                                                    <Box sx={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2}}>
                                                        <Box>
                                                            <Typography variant="body2" sx={{mb: 0.5}}>
                                                                <strong>Contact ID:</strong> {contact.id}
                                                            </Typography>
                                                            <Typography variant="body2" sx={{mb: 0.5}}>
                                                                <strong>Type:</strong> {contact.type}
                                                            </Typography>
                                                            {contact.url && (
                                                                <Typography variant="body2" sx={{mb: 0.5}}>
                                                                    <strong>HubSpot URL:</strong> <a href={contact.url} target="_blank" rel="noopener noreferrer" style={{color: '#1976d2', textDecoration: 'underline'}}>View in HubSpot</a>
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                        <Box>
                                                            {contact.creation_time && (
                                                                <Typography variant="body2" sx={{mb: 0.5}}>
                                                                    <strong>Created:</strong> {new Date(contact.creation_time).toLocaleString()}
                                                                </Typography>
                                                            )}
                                                            {contact.last_modified_time && (
                                                                <Typography variant="body2" sx={{mb: 0.5}}>
                                                                    <strong>Updated:</strong> {new Date(contact.last_modified_time).toLocaleString()}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                                
                                {/* Companies Section */}
                                {objects.filter(obj => obj.type === 'Company').length > 0 && (
                                    <Box sx={{mb: 3}}>
                                        <Typography variant="h6" gutterBottom>
                                            HubSpot Companies ({objects.filter(obj => obj.type === 'Company').length})
                                        </Typography>
                                        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                                            {objects.filter(obj => obj.type === 'Company').map((company, index) => (
                                                <Box key={`company-${index}`} sx={{p: 3, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#f9f9f9', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
                                                    <Typography variant="h6" sx={{fontWeight: 'bold', color: '#2e7d32', mb: 1}}>
                                                        {company.name}
                                                    </Typography>
                                                    <Box sx={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2}}>
                                                        <Box>
                                                            <Typography variant="body2" sx={{mb: 0.5}}>
                                                                <strong>Company ID:</strong> {company.id}
                                                            </Typography>
                                                            <Typography variant="body2" sx={{mb: 0.5}}>
                                                                <strong>Type:</strong> {company.type}
                                                            </Typography>
                                                            {company.url && (
                                                                <Typography variant="body2" sx={{mb: 0.5}}>
                                                                    <strong>HubSpot URL:</strong> <a href={company.url} target="_blank" rel="noopener noreferrer" style={{color: '#2e7d32', textDecoration: 'underline'}}>View in HubSpot</a>
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                        <Box>
                                                            {company.creation_time && (
                                                                <Typography variant="body2" sx={{mb: 0.5}}>
                                                                    <strong>Created:</strong> {new Date(company.creation_time).toLocaleString()}
                                                                </Typography>
                                                            )}
                                                            {company.last_modified_time && (
                                                                <Typography variant="body2" sx={{mb: 0.5}}>
                                                                    <strong>Updated:</strong> {new Date(company.last_modified_time).toLocaleString()}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                                
                                {/* Deals Section */}
                                {objects.filter(obj => obj.type === 'Deal').length > 0 && (
                                    <Box sx={{mb: 3}}>
                                        <Typography variant="h6" gutterBottom>
                                            HubSpot Deals ({objects.filter(obj => obj.type === 'Deal').length})
                                        </Typography>
                                        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                                            {objects.filter(obj => obj.type === 'Deal').map((deal, index) => (
                                                <Box key={`deal-${index}`} sx={{p: 3, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#fff3e0', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
                                                    <Typography variant="h6" sx={{fontWeight: 'bold', color: '#f57c00', mb: 1}}>
                                                        {deal.name}
                                                    </Typography>
                                                    <Box sx={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2}}>
                                                        <Box>
                                                            <Typography variant="body2" sx={{mb: 0.5}}>
                                                                <strong>Deal ID:</strong> {deal.id}
                                                            </Typography>
                                                            <Typography variant="body2" sx={{mb: 0.5}}>
                                                                <strong>Type:</strong> {deal.type}
                                                            </Typography>
                                                            {deal.url && (
                                                                <Typography variant="body2" sx={{mb: 0.5}}>
                                                                    <strong>HubSpot URL:</strong> <a href={deal.url} target="_blank" rel="noopener noreferrer" style={{color: '#f57c00', textDecoration: 'underline'}}>View in HubSpot</a>
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                        <Box>
                                                            {deal.creation_time && (
                                                                <Typography variant="body2" sx={{mb: 0.5}}>
                                                                    <strong>Created:</strong> {new Date(deal.creation_time).toLocaleString()}
                                                                </Typography>
                                                            )}
                                                            {deal.last_modified_time && (
                                                                <Typography variant="body2" sx={{mb: 0.5}}>
                                                                    <strong>Updated:</strong> {new Date(deal.last_modified_time).toLocaleString()}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                                
                                {/* Invoices Section */}
                                {objects.filter(obj => obj.type === 'Invoice').length > 0 && (
                                    <Box sx={{mb: 3}}>
                                        <Typography variant="h6" gutterBottom>
                                            HubSpot Invoices ({objects.filter(obj => obj.type === 'Invoice').length})
                                        </Typography>
                                        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                                            {objects.filter(obj => obj.type === 'Invoice').map((invoice, index) => (
                                                <Box key={`invoice-${index}`} sx={{p: 3, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#e8f5e8', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
                                                    <Typography variant="h6" sx={{fontWeight: 'bold', color: '#388e3c', mb: 1}}>
                                                        {invoice.name}
                                                    </Typography>
                                                    <Box sx={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2}}>
                                                        <Box>
                                                            <Typography variant="body2" sx={{mb: 0.5}}>
                                                                <strong>Invoice ID:</strong> {invoice.id}
                                                            </Typography>
                                                            <Typography variant="body2" sx={{mb: 0.5}}>
                                                                <strong>Type:</strong> {invoice.type}
                                                            </Typography>
                                                            {invoice.url && (
                                                                <Typography variant="body2" sx={{mb: 0.5}}>
                                                                    <strong>HubSpot URL:</strong> <a href={invoice.url} target="_blank" rel="noopener noreferrer" style={{color: '#388e3c', textDecoration: 'underline'}}>View in HubSpot</a>
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                        <Box>
                                                            {invoice.creation_time && (
                                                                <Typography variant="body2" sx={{mb: 0.5}}>
                                                                    <strong>Created:</strong> {new Date(invoice.creation_time).toLocaleString()}
                                                                </Typography>
                                                            )}
                                                            {invoice.last_modified_time && (
                                                                <Typography variant="body2" sx={{mb: 0.5}}>
                                                                    <strong>Updated:</strong> {new Date(invoice.last_modified_time).toLocaleString()}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                                
                                {/* Appointments Section */}
                                {objects.filter(obj => obj.type === 'Appointment').length > 0 && (
                                    <Box sx={{mb: 3}}>
                                        <Typography variant="h6" gutterBottom>
                                            HubSpot Appointments ({objects.filter(obj => obj.type === 'Appointment').length})
                                        </Typography>
                                        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                                            {objects.filter(obj => obj.type === 'Appointment').map((appointment, index) => (
                                                <Box key={`appointment-${index}`} sx={{p: 3, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#f3e5f5', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
                                                    <Typography variant="h6" sx={{fontWeight: 'bold', color: '#7b1fa2', mb: 1}}>
                                                        {appointment.name}
                                                    </Typography>
                                                    <Box sx={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2}}>
                                                        <Box>
                                                            <Typography variant="body2" sx={{mb: 0.5}}>
                                                                <strong>Appointment ID:</strong> {appointment.id}
                                                            </Typography>
                                                            <Typography variant="body2" sx={{mb: 0.5}}>
                                                                <strong>Type:</strong> {appointment.type}
                                                            </Typography>
                                                            {appointment.url && (
                                                                <Typography variant="body2" sx={{mb: 0.5}}>
                                                                    <strong>HubSpot URL:</strong> <a href={appointment.url} target="_blank" rel="noopener noreferrer" style={{color: '#7b1fa2', textDecoration: 'underline'}}>View in HubSpot</a>
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                        <Box>
                                                            {appointment.creation_time && (
                                                                <Typography variant="body2" sx={{mb: 0.5}}>
                                                                    <strong>Created:</strong> {new Date(appointment.creation_time).toLocaleString()}
                                                                </Typography>
                                                            )}
                                                            {appointment.last_modified_time && (
                                                                <Typography variant="body2" sx={{mb: 0.5}}>
                                                                    <strong>Updated:</strong> {new Date(appointment.last_modified_time).toLocaleString()}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                                
                                {/* Products Section */}
                                {objects.filter(obj => obj.type === 'Product').length > 0 && (
                                    <Box sx={{mb: 3}}>
                                        <Typography variant="h6" gutterBottom>
                                            HubSpot Products ({objects.filter(obj => obj.type === 'Product').length})
                                        </Typography>
                                        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                                            {objects.filter(obj => obj.type === 'Product').map((product, index) => (
                                                <Box key={`product-${index}`} sx={{p: 3, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#e3f2fd', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
                                                    <Typography variant="h6" sx={{fontWeight: 'bold', color: '#1565c0', mb: 1}}>
                                                        {product.name}
                                                    </Typography>
                                                    <Box sx={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2}}>
                                                        <Box>
                                                            <Typography variant="body2" sx={{mb: 0.5}}>
                                                                <strong>Product ID:</strong> {product.id}
                                                            </Typography>
                                                            <Typography variant="body2" sx={{mb: 0.5}}>
                                                                <strong>Type:</strong> {product.type}
                                                            </Typography>
                                                            {product.url && (
                                                                <Typography variant="body2" sx={{mb: 0.5}}>
                                                                    <strong>HubSpot URL:</strong> <a href={product.url} target="_blank" rel="noopener noreferrer" style={{color: '#1565c0', textDecoration: 'underline'}}>View in HubSpot</a>
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                        <Box>
                                                            {product.creation_time && (
                                                                <Typography variant="body2" sx={{mb: 0.5}}>
                                                                    <strong>Created:</strong> {new Date(product.creation_time).toLocaleString()}
                                                                </Typography>
                                                            )}
                                                            {product.last_modified_time && (
                                                                <Typography variant="body2" sx={{mb: 0.5}}>
                                                                    <strong>Updated:</strong> {new Date(product.last_modified_time).toLocaleString()}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                                
                                {/* Line Items Section */}
                                {objects.filter(obj => obj.type === 'Line Item').length > 0 && (
                                    <Box>
                                        <Typography variant="h6" gutterBottom>
                                            HubSpot Line Items ({objects.filter(obj => obj.type === 'Line Item').length})
                                        </Typography>
                                        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                                            {objects.filter(obj => obj.type === 'Line Item').map((lineItem, index) => (
                                                <Box key={`lineitem-${index}`} sx={{p: 3, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#fff8e1', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
                                                    <Typography variant="h6" sx={{fontWeight: 'bold', color: '#f9a825', mb: 1}}>
                                                        {lineItem.name}
                                                    </Typography>
                                                    <Box sx={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2}}>
                                                        <Box>
                                                            <Typography variant="body2" sx={{mb: 0.5}}>
                                                                <strong>Line Item ID:</strong> {lineItem.id}
                                                            </Typography>
                                                            <Typography variant="body2" sx={{mb: 0.5}}>
                                                                <strong>Type:</strong> {lineItem.type}
                                                            </Typography>
                                                            {lineItem.url && (
                                                                <Typography variant="body2" sx={{mb: 0.5}}>
                                                                    <strong>HubSpot URL:</strong> <a href={lineItem.url} target="_blank" rel="noopener noreferrer" style={{color: '#f9a825', textDecoration: 'underline'}}>View in HubSpot</a>
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                        <Box>
                                                            {lineItem.creation_time && (
                                                                <Typography variant="body2" sx={{mb: 0.5}}>
                                                                    <strong>Created:</strong> {new Date(lineItem.creation_time).toLocaleString()}
                                                                </Typography>
                                                            )}
                                                            {lineItem.last_modified_time && (
                                                                <Typography variant="body2" sx={{mb: 0.5}}>
                                                                    <strong>Updated:</strong> {new Date(lineItem.last_modified_time).toLocaleString()}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>

                    {/* Webhook Events Section */}
                    <Box sx={{mt: 4}}>
                        <Typography variant="h6" gutterBottom>
                            Webhook Events
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                            Monitor real-time events from HubSpot. Configure webhooks in HubSpot to send events to your endpoint.
                        </Typography>
                        
                        <Box sx={{display: 'flex', gap: 2, mb: 2}}>
                            <Button
                                variant="outlined"
                                onClick={handleLoadWebhookEvents}
                                disabled={isLoadingWebhooks}
                            >
                                {isLoadingWebhooks ? <CircularProgress size={20} /> : 'Load Webhook Events'}
                            </Button>
                            
                            <Button
                                variant="outlined"
                                onClick={handleClearWebhookEvents}
                                color="warning"
                            >
                                Clear Webhook Events
                            </Button>
                        </Box>

                        {/* Webhook URL Display */}
                        <Box sx={{mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#f8f9fa'}}>
                            <Typography variant="subtitle2" gutterBottom>
                                Webhook URL (for HubSpot configuration):
                            </Typography>
                            <Box sx={{fontFamily: 'monospace', fontSize: '0.8rem', bgcolor: 'white', p: 1, borderRadius: 0.5, border: '1px solid #ddd'}}>
                                https://798008730f2b.ngrok-free.app/webhooks/hubspot
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{mt: 1, display: 'block'}}>
                                This URL is publicly accessible via ngrok
                            </Typography>
                        </Box>

                        {/* Webhook Events Display */}
                        <Box sx={{mt: 2}}>
                            <Typography variant="subtitle2" gutterBottom>
                                Webhook Events Status:
                            </Typography>
                            
                            {webhookEvents.length > 0 ? (
                                <Box>
                                    <Typography variant="body2" color="success.main" gutterBottom>
                                        ✅ Found {webhookEvents.length} webhook events
                                    </Typography>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Recent Webhook Events:
                                    </Typography>
                                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
                                        {webhookEvents.map((event, index) => (
                                            <Box key={`webhook-${index}`} sx={{p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#fff3e0'}}>
                                                <Box sx={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2}}>
                                                    <Box>
                                                        <Typography variant="body2" sx={{mb: 0.5}}>
                                                            <strong>Event Type:</strong> {event.subscriptionType}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{mb: 0.5}}>
                                                            <strong>Object Type:</strong> {event.objectType}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{mb: 0.5}}>
                                                            <strong>Object ID:</strong> {event.objectId}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{mb: 0.5}}>
                                                            <strong>Change Flag:</strong> {event.changeFlag}
                                                        </Typography>
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="body2" sx={{mb: 0.5}}>
                                                            <strong>Portal ID:</strong> {event.portalId}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{mb: 0.5}}>
                                                            <strong>Event ID:</strong> {event.eventId}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{mb: 0.5}}>
                                                            <strong>Received:</strong> {event.received_at ? new Date(event.received_at).toLocaleString() : 'N/A'}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{mb: 0.5}}>
                                                            <strong>Source:</strong> {event.sourceId}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            ) : (
                                <Box sx={{p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#f5f5f5'}}>
                                    <Typography variant="body2" color="text.secondary">
                                        No webhook events found yet. Events will appear here after:
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>
                                        • Configuring webhooks in HubSpot
                                        • Triggering events (create/update contacts, deals, etc.)
                                        • Successfully receiving webhook calls
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>
            )}
        </Box>
      </>
    );
}

