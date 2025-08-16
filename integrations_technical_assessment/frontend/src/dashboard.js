import {
    Box,
    AppBar,
    Toolbar,
    Typography,
    Button,
    Container,
    Paper,
    Grid,
    Card,
    CardContent,
    CardActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
// import { IntegrationForm } from './integration-form';

export const Dashboard = ({ user, onLogout, hubspotParams, notionParams, airtableParams }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        onLogout();
        navigate('/');
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            {/* Header */}
            <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#1976d2', fontWeight: 'bold' }}>
                        Integrations Dashboard
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Welcome, <strong>{user?.username}</strong>
                        </Typography>

                        <Button
                            variant="outlined"
                            onClick={handleLogout}
                            sx={{ 
                                borderColor: '#1976d2', 
                                color: '#1976d2',
                                '&:hover': {
                                    borderColor: '#1565c0',
                                    bgcolor: 'rgba(25, 118, 210, 0.04)'
                                }
                            }}
                        >
                            Logout
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Main Content */}
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
                    <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3, color: '#1976d2', fontWeight: 'bold' }}>
                        Integration Management
                    </Typography>
                    
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                        Choose an integration to connect and manage your data. Each integration has its own dedicated page with specialized tools and data views.
                    </Typography>
                    
                    <Grid container spacing={3}>
                        {/* HubSpot Card */}
                        <Grid item xs={12} md={4}>
                            <Card 
                                elevation={3} 
                                sx={{ 
                                    height: '100%',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                                    }
                                }}
                                onClick={() => navigate('/hubspot')}
                            >
                                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                                    <Box sx={{ 
                                        width: 60, 
                                        height: 60, 
                                        bgcolor: '#1976d2', 
                                        borderRadius: '50%', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        mx: 'auto',
                                        mb: 2
                                    }}>
                                        <Typography variant="h6" color="white" fontWeight="bold">
                                            HS
                                        </Typography>
                                    </Box>
                                    <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                        HubSpot CRM
                                    </Typography>
                                                                         <Typography variant="body2" color="text.secondary">
                                         Connect to HubSpot to manage contacts, companies, and timeline events. View your CRM data in real-time.
                                     </Typography>
                                     {hubspotParams?.type && (
                                         <Box sx={{ 
                                             mt: 2, 
                                             px: 2, 
                                             py: 0.5, 
                                             bgcolor: '#e8f5e8', 
                                             borderRadius: 2, 
                                             border: '1px solid #4caf50',
                                             display: 'inline-block'
                                         }}>
                                             <Typography variant="caption" color="#2e7d32" sx={{ fontWeight: 'medium' }}>
                                                 ✓ Connected
                                             </Typography>
                                         </Box>
                                     )}
                                 </CardContent>
                                 <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                                     <Button 
                                         variant="contained" 
                                         size="small"
                                         sx={{ 
                                             bgcolor: '#1976d2',
                                             '&:hover': { bgcolor: '#1565c0' }
                                         }}
                                     >
                                         {hubspotParams?.type ? 'Manage HubSpot' : 'Open HubSpot'}
                                     </Button>
                                 </CardActions>
                            </Card>
                        </Grid>

                        {/* Notion Card */}
                        <Grid item xs={12} md={4}>
                            <Card 
                                elevation={3} 
                                sx={{ 
                                    height: '100%',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                                    }
                                }}
                                onClick={() => navigate('/notion')}
                            >
                                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                                    <Box sx={{ 
                                        width: 60, 
                                        height: 60, 
                                        bgcolor: '#000000', 
                                        borderRadius: '50%', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        mx: 'auto',
                                        mb: 2
                                    }}>
                                        <Typography variant="h6" color="white" fontWeight="bold">
                                            N
                                        </Typography>
                                    </Box>
                                    <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: '#000000' }}>
                                        Notion Workspace
                                    </Typography>
                                                                         <Typography variant="body2" color="text.secondary">
                                         Connect to Notion to access workspaces, databases, and pages. Manage your knowledge base and content.
                                     </Typography>
                                     {notionParams?.type && (
                                         <Box sx={{ 
                                             mt: 2, 
                                             px: 2, 
                                             py: 0.5, 
                                             bgcolor: '#e8f5e8', 
                                             borderRadius: 2, 
                                             border: '1px solid #4caf50',
                                             display: 'inline-block'
                                         }}>
                                             <Typography variant="caption" color="#2e7d32" sx={{ fontWeight: 'medium' }}>
                                                 ✓ Connected
                                             </Typography>
                                         </Box>
                                     )}
                                 </CardContent>
                                 <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                                     <Button 
                                         variant="contained" 
                                         size="small"
                                         sx={{ 
                                             bgcolor: '#000000',
                                             '&:hover': { bgcolor: '#424242' }
                                         }}
                                     >
                                         {notionParams?.type ? 'Manage Notion' : 'Open Notion'}
                                     </Button>
                                 </CardActions>
                            </Card>
                        </Grid>

                        {/* Airtable Card */}
                        <Grid item xs={12} md={4}>
                            <Card 
                                elevation={3} 
                                sx={{ 
                                    height: '100%',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                                    }
                                }}
                                onClick={() => navigate('/airtable')}
                            >
                                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                                    <Box sx={{ 
                                        width: 60, 
                                        height: 60, 
                                        bgcolor: '#ff6b35', 
                                        borderRadius: '50%', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        mx: 'auto',
                                        mb: 2
                                    }}>
                                        <Typography variant="h6" color="white" fontWeight="bold">
                                            A
                                        </Typography>
                                    </Box>
                                    <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: '#ff6b35' }}>
                                        Airtable Database
                                    </Typography>
                                                                         <Typography variant="body2" color="text.secondary">
                                         Connect to Airtable to manage bases, tables, and data. Organize and view your database information.
                                     </Typography>
                                     {airtableParams?.type && (
                                         <Box sx={{ 
                                             mt: 2, 
                                             px: 2, 
                                             py: 0.5, 
                                             bgcolor: '#e8f5e8', 
                                             borderRadius: 2, 
                                             border: '1px solid #4caf50',
                                             display: 'inline-block'
                                         }}>
                                             <Typography variant="caption" color="#2e7d32" sx={{ fontWeight: 'medium' }}>
                                                 ✓ Connected
                                             </Typography>
                                         </Box>
                                     )}
                                 </CardContent>
                                 <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                                     <Button 
                                         variant="contained" 
                                         size="small"
                                         sx={{ 
                                             bgcolor: '#ff6b35',
                                             '&:hover': { bgcolor: '#e55a2b' }
                                         }}
                                     >
                                         {airtableParams?.type ? 'Manage Airtable' : 'Open Airtable'}
                                     </Button>
                                 </CardActions>
                            </Card>
                        </Grid>
                    </Grid>
                </Paper>
            </Container>
        </Box>
    );
};
