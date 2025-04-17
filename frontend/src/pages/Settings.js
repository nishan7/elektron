import React, { useState } from 'react';
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
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

function Settings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    alertThreshold: 80,
    refreshInterval: 30,
    darkMode: false,
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleChange = (event) => {
    const { name, value, checked } = event.target;
    setSettings({
      ...settings,
      [name]: event.target.type === 'checkbox' ? checked : value,
    });
  };

  const handleSave = () => {
    // Here you would typically make an API call to save the settings
    setSnackbar({
      open: true,
      message: 'Settings saved successfully',
      severity: 'success',
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

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
              label="Alert Threshold (%)"
              name="alertThreshold"
              type="number"
              value={settings.alertThreshold}
              onChange={handleChange}
              margin="normal"
              helperText="Set the threshold percentage for triggering alerts"
            />
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
              value={settings.refreshInterval}
              onChange={handleChange}
              margin="normal"
              helperText="Set how often the dashboard should refresh"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.darkMode}
                  onChange={handleChange}
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
              >
                Save Settings
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