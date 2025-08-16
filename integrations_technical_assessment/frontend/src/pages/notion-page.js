
import {
    Box,
    AppBar,
    Toolbar,
    Typography,
    Button,
    Container,
    Paper,
    Breadcrumbs,
    Link
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { NotionIntegration } from '../integrations/notion';

export const NotionPage = ({ user, onLogout, integrationParams, setIntegrationParams }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        onLogout();
        navigate('/');
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            {/* Header */}
            <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#000000', fontWeight: 'bold' }}>
                        Notion Integration
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Welcome, <strong>{user?.username}</strong>
                        </Typography>
                        <Button
                            variant="outlined"
                            onClick={handleBackToDashboard}
                            sx={{ 
                                borderColor: '#000000', 
                                color: '#000000',
                                '&:hover': {
                                    borderColor: '#424242',
                                    bgcolor: 'rgba(0, 0, 0, 0.04)'
                                }
                            }}
                        >
                            Back to Dashboard
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={handleLogout}
                            sx={{ 
                                borderColor: '#d32f2f', 
                                color: '#d32f2f',
                                '&:hover': {
                                    borderColor: '#c62828',
                                    bgcolor: 'rgba(211, 47, 47, 0.04)'
                                }
                            }}
                        >
                            Logout
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Breadcrumbs */}
            <Container maxWidth="lg" sx={{ py: 2 }}>
                <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
                    <Link
                        underline="hover"
                        color="inherit"
                        onClick={handleBackToDashboard}
                        sx={{ cursor: 'pointer', '&:hover': { color: '#000000' } }}
                    >
                        Dashboard
                    </Link>
                    <Typography color="text.primary">Notion</Typography>
                </Breadcrumbs>
            </Container>

            {/* Main Content */}
            <Container maxWidth="lg" sx={{ py: 2 }}>
                <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#000000', fontWeight: 'bold' }}>
                            Notion Workspace Integration
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Connect to Notion to access and manage your workspaces, databases, and pages.
                        </Typography>
                    </Box>
                    
                    <NotionIntegration 
                        user={user?.username} 
                        org={user?.username} 
                        integrationParams={integrationParams}
                        setIntegrationParams={setIntegrationParams}
                    />
                </Paper>
            </Container>
        </Box>
    );
};
