import { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Alert,
} from '@mui/material';
import axios from 'axios';

const endpointMapping = {
    'Notion': 'notion',
    'Airtable': 'airtable',
    'HubSpot': 'hubspot',
};

export const DataForm = ({ integrationType, credentials }) => {
    const [loadedData, setLoadedData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const endpoint = endpointMapping[integrationType];

    const handleLoad = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const formData = new FormData();
            formData.append('credentials', JSON.stringify(credentials));
            const response = await axios.post(`http://localhost:8000/integrations/${endpoint}/load`, formData);
            const data = response.data;
            setLoadedData(data);
        } catch (e) {
            setError(e?.response?.data?.detail || e.message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Box display='flex' justifyContent='center' alignItems='center' flexDirection='column' width='100%'>
            <Box display='flex' flexDirection='column' width='100%'>
                <Typography variant="h6" sx={{mt: 2, mb: 1}}>
                    Data Form - {integrationType}
                </Typography>
                
                {error && (
                    <Alert severity="error" sx={{mb: 2}}>
                        {error}
                    </Alert>
                )}
                
                {!loadedData && !isLoading && (
                    <Box sx={{mt: 2, mb: 2}}>
                        <Typography variant="body2" color="text.secondary">
                            No data loaded yet. Click "Load Data" to fetch data from {integrationType}.
                        </Typography>
                    </Box>
                )}
                
                {loadedData && (
                    <Box sx={{mt: 2, mb: 2}}>
                        <Typography variant="subtitle2" gutterBottom>
                            Raw Data (JSON):
                        </Typography>
                        <TextField
                            label="Loaded Data"
                            value={JSON.stringify(loadedData, null, 2)}
                            sx={{mt: 1}}
                            InputLabelProps={{ shrink: true }}
                            multiline
                            rows={6}
                            fullWidth
                            disabled
                        />
                        
                        {Array.isArray(loadedData) && (
                            <Box sx={{mt: 2}}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Summary:
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Loaded {loadedData.length} items from {integrationType}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
                
                <Button
                    onClick={handleLoad}
                    sx={{mt: 2}}
                    variant='contained'
                    disabled={isLoading}
                >
                    {isLoading ? 'Loading...' : 'Load Data'}
                </Button>
                <Button
                    onClick={() => {
                        setLoadedData(null);
                        setError(null);
                    }}
                    sx={{mt: 1}}
                    variant='outlined'
                >
                    Clear Data
                </Button>
            </Box>
        </Box>
    );
}
