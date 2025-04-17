import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';

// Layout components
import Layout from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Analytics from './pages/Analytics';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex' }}>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/devices" element={<Devices />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App; 