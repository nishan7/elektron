import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import config from '../config';

function Settings() {
  const { darkMode, toggleDarkMode } = useTheme();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    alertThreshold: '',
    refreshInterval: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${config.apiUrl}/api/settings`);
        
        // Format the power threshold value for display - with safety checks
        const responseData = response.data || {};
        const settingsData = {
          emailNotifications: responseData.emailNotifications ?? true,
          alertThreshold: responseData.alertThreshold != null ? 
            responseData.alertThreshold.toString() : '',
          refreshInterval: responseData.refreshInterval != null ? 
            responseData.refreshInterval.toString() : ''
        };
        
        setSettings(settingsData);
      } catch (err) {
        console.error("Error fetching settings:", err);
        setError("Failed to load settings. Using defaults.");
        setSnackbar({
          open: true,
          message: 'Failed to load settings. Using defaults.',
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (event) => {
    const { name, value, checked } = event.target;
    setSettings({
      ...settings,
      [name]: event.target.type === 'checkbox' ? checked : value,
    });
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      
      // Prepare data with proper types
      const dataToSend = {
        ...settings,
        alertThreshold: settings.alertThreshold 
          ? (parseFloat(settings.alertThreshold) > 0 
             ? parseFloat(settings.alertThreshold) 
             : null) 
          : null,
        refreshInterval: settings.refreshInterval ? parseInt(settings.refreshInterval, 10) : null
      };
      
      // Remove the trailing slash
      const response = await axios.post(`${config.apiUrl}/api/settings`, dataToSend);
      
      // Format the power threshold value for display - with safety checks
      const responseData = response.data || {};
      const updatedSettings = {
        emailNotifications: responseData.emailNotifications ?? true,
        alertThreshold: responseData.alertThreshold != null ? 
          responseData.alertThreshold.toString() : '',
        refreshInterval: responseData.refreshInterval != null ? 
          responseData.refreshInterval.toString() : ''
      };
      
      setSettings(updatedSettings);
      setSnackbar({
        open: true,
        message: 'Settings saved successfully',
        severity: 'success',
      });
    } catch (err) {
      console.error("Error saving settings:", err);
      setSnackbar({
        open: true,
        message: `Failed to save settings: ${err.message}`,
        severity: 'error',
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3, mt: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Notifications
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.emailNotifications}
                  onChange={handleChange}
                  name="emailNotifications"
                />
              }
              label="Email Notifications"
            />
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Alert Settings
            </Typography>
            <TextField
              fullWidth
              label="Alert Threshold (W)"
              name="alertThreshold"
              type="number"
              value={settings.alertThreshold ?? ''}
              onChange={handleChange}
              margin="normal"
              helperText="Set the threshold in Watts (W) for triggering alerts. Will be applied to all devices without specific thresholds."
              InputProps={{
                endAdornment: <Typography variant="body2">W</Typography>,
                inputProps: { min: 0 }
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              When a device's power consumption exceeds this threshold, an alert will be triggered. 
              Set to 0 or leave empty to disable global power alerts.
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Display Settings
            </Typography>
            <TextField
              fullWidth
              label="Refresh Interval (seconds)"
              name="refreshInterval"
              type="number"
              value={settings.refreshInterval ?? ''}
              onChange={handleChange}
              margin="normal"
              helperText="Set how often the dashboard should refresh"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={darkMode}
                  onChange={toggleDarkMode}
                  name="darkMode"
                />
              }
              label="Dark Mode"
            />
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saveLoading}
              >
                {saveLoading ? <CircularProgress size={24} /> : 'Save Settings'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Settings; 