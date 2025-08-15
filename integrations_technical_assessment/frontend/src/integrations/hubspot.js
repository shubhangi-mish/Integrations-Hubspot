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
                setIntegrationParams(prev => ({ ...prev, credentials: credentials, type: 'HubSpot' }));
            }
            setIsConnecting(false);
        } catch (e) {
            setIsConnecting(false);
            alert(e?.response?.data?.detail);
        }
    }

    useEffect(() => {
        setIsConnected(integrationParams?.credentials ? true : false)
    }, [integrationParams?.credentials]);



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
                 setEventMessage(`Loaded ${response.data.length} contacts from HubSpot`);
             } else {
                 console.log('Response data is not an array:', typeof response.data, response.data);
                 setEventMessage('Error: Invalid data format received');
             }
        } catch (e) {
            setEventMessage(`Error loading objects: ${e?.response?.data?.detail || e.message}`);
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
                                 <Typography variant="h6" gutterBottom>
                                     HubSpot Contacts
                                 </Typography>
                                 <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                                     {objects.map((contact, index) => (
                                         <Box key={index} sx={{p: 3, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#fafafa', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
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
                    </Box>
                </Box>
            )}
        </Box>
      </>
    );
}

