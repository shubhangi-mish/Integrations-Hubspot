# Integrations Frontend

A modern React application for managing various integrations with a beautiful login system and dashboard interface.

## Features

- **Secure Login System**: Professional login page with test credentials
- **Integration Management**: Connect and manage HubSpot, Notion, and Airtable integrations
- **Modern UI**: Material-UI components with beautiful gradients and animations
- **Responsive Design**: Works on all device sizes
- **Real-time Data**: View and manage your integration data

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Login Credentials

**Demo Account:**
- **Username**: `TestUser`
- **Password**: `TestPassword`

## App Flow

1. **Login Page**: Enter credentials to access the dashboard
2. **Dashboard**: Main interface with integration management
3. **Integrations**: Connect to various services (HubSpot, Notion, Airtable)
4. **Data View**: View and manage your integration data

## Available Integrations

### HubSpot
- OAuth 2.0 authentication
- View contacts and companies
- Timeline events management
- Real-time data synchronization

### Notion
- OAuth 2.0 authentication
- Document and database access
- Content management

### Airtable
- OAuth 2.0 authentication
- Base and table management
- Data synchronization

## Project Structure

```
src/
├── App.js              # Main app with routing
├── login.js            # Login page component
├── dashboard.js        # Dashboard with header and navigation
├── integration-form.js # Main integration management form
├── integrations/       # Integration-specific components
│   ├── hubspot.js     # HubSpot integration
│   ├── notion.js      # Notion integration
│   └── airtable.js    # Airtable integration
└── data-form.js       # Data display component
```

## Technologies Used

- **React 18**: Modern React with hooks
- **React Router**: Client-side routing
- **Material-UI**: Professional UI components
- **Axios**: HTTP client for API calls
- **CSS-in-JS**: Styled components with Material-UI

## Development

### Adding New Integrations

1. Create a new component in `src/integrations/`
2. Add it to the `integrationMapping` in `integration-form.js`
3. Implement the required OAuth flow and data fetching

### Styling

The app uses Material-UI's `sx` prop for custom styling. All components follow a consistent design system with:
- Primary color: `#1976d2` (Blue)
- Secondary color: `#2e7d32` (Green)
- Background: `#f5f5f5` (Light Gray)
- Gradients for visual appeal

## Backend Integration

This frontend connects to a FastAPI backend running on `http://localhost:8000`. Make sure the backend is running before testing integrations.

## Troubleshooting

- **Login Issues**: Ensure you're using the correct test credentials
- **Integration Errors**: Check that the backend server is running
- **OAuth Problems**: Verify your integration app configurations
- **Data Loading**: Check browser console for API errors

## License

This project is part of a technical assessment for automation integrations.
