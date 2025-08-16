import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './login';
import { Dashboard } from './dashboard';
import { HubSpotPage, NotionPage, AirtablePage } from './pages';

function App() {
  const [user, setUser] = useState(null);
  const [hubspotParams, setHubspotParams] = useState({});
  const [notionParams, setNotionParams] = useState({});
  const [airtableParams, setAirtableParams] = useState({});

  const handleLogin = (credentials) => {
    setUser(credentials);
  };

  const handleLogout = () => {
    setUser(null);
    setHubspotParams({});
    setNotionParams({});
    setAirtableParams({});
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" /> : <LoginPage onLogin={handleLogin} />} 
        />
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard user={user} onLogout={handleLogout} hubspotParams={hubspotParams} notionParams={notionParams} airtableParams={airtableParams} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/hubspot" 
          element={user ? <HubSpotPage user={user} onLogout={handleLogout} integrationParams={hubspotParams} setIntegrationParams={setHubspotParams} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/notion" 
          element={user ? <NotionPage user={user} onLogout={handleLogout} integrationParams={notionParams} setIntegrationParams={setNotionParams} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/airtable" 
          element={user ? <AirtablePage user={user} onLogout={handleLogout} integrationParams={airtableParams} setIntegrationParams={setAirtableParams} /> : <Navigate to="/" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
