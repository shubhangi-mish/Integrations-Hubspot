import { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    Alert,
    Container
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

export const LoginPage = ({ onLogin }) => {
    const [credentials, setCredentials] = useState({
        username: 'TestUser',
        password: 'TestPassword'
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Simulate login validation with test credentials
        if (credentials.username === 'TestUser' && credentials.password === 'TestPassword') {
            // Success - redirect to main app
            setTimeout(() => {
                onLogin(credentials);
                navigate('/dashboard');
            }, 1000); // Small delay for better UX
        } else {
            setError('Invalid credentials. Use TestUser/TestPassword');
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value
        });
    };

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
            >
                <Paper
                    elevation={8}
                    sx={{
                        p: 4,
                        width: '100%',
                        borderRadius: 3,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <Box textAlign="center" mb={4}>
                        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                            Welcome Back
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Sign in to access your integrations dashboard
                        </Typography>
                    </Box>

                    <form onSubmit={handleLogin}>
                        <TextField
                            fullWidth
                            label="Username"
                            name="username"
                            value={credentials.username}
                            onChange={handleInputChange}
                            margin="normal"
                            variant="outlined"
                            size="large"
                            sx={{ mb: 2 }}
                        />
                        
                        <TextField
                            fullWidth
                            label="Password"
                            name="password"
                            type="password"
                            value={credentials.password}
                            onChange={handleInputChange}
                            margin="normal"
                            variant="outlined"
                            size="large"
                            sx={{ mb: 3 }}
                        />

                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={isLoading}
                            sx={{
                                py: 1.5,
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                borderRadius: 2,
                                background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)'
                                }
                            }}
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </Button>
                        
                        {isLoading && (
                            <Box sx={{ mt: 2, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Redirecting to dashboard...
                                </Typography>
                            </Box>
                        )}
                    </form>

                    <Box mt={3} textAlign="center">
                        <Typography variant="body2" color="text.secondary">
                            <strong>Demo Credentials:</strong> TestUser / TestPassword
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};
