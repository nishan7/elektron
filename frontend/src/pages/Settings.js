import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Card,
  CardContent,
  Alert,
  Tooltip,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  AttachMoney as MoneyIcon,
  Power as PowerIcon,
} from '@mui/icons-material';

import API from '../API';
import { useTheme } from '../context/ThemeContext'; 

const Settings = () => {
  const { darkMode, toggleDarkMode } = useTheme(); 

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setLoadError(null);
    API.get('/api/settings')
      .then(response => {
        if (isMounted) {
          console.log("Fetched settings:", response.data);
          setSettings({
            notifications: response.data?.notifications || { email: true, sms: false, criticalAlerts: true },
            thresholds: response.data?.thresholds || { powerAlert: null, costAlert: null, criticalThreshold: null, dataRefreshInterval: 30, timeZone: 'UTC' }
          });
        }
      })
      .catch(err => {
        console.error("Failed to load settings:", err);
        if (isMounted) {
          setLoadError(err.response?.data?.detail || "Could not load settings.");
    }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });
    
    return () => { isMounted = false; };
  }, []);

  const handleThresholdChange = (field, value) => {
    const numValue = (field === 'powerAlert' || field === 'costAlert' || field === 'criticalThreshold' || field === 'dataRefreshInterval') 
                      ? parseFloat(value) || 0 
                      : value;
    setSettings(prev => ({
      ...prev,
      thresholds: {
        ...prev.thresholds,
        [field]: numValue
      }
    }));
  };

  const handleNotificationChange = (field) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: !prev.notifications[field]
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    console.log('Saving settings:', settings);

    try {
      const response = await API.put('/api/settings', settings);
      console.log('Save successful:', response.data);
      setSaveSuccess(true);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveError(err.response?.data?.detail || "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>;
  }

  if (loadError) {
    return <Alert severity="error" sx={{ m: 3 }}>{loadError}</Alert>;
  }

  if (!settings) {
    return null;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        {saveSuccess && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaveSuccess(false)}>Settings saved successfully!</Alert>}
        {saveError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError(null)}>{saveError}</Alert>}

        <Grid container spacing={3}>
          <Grid item xs={12}>
             <Box display="flex" alignItems="center" mb={2}>
              <InfoIcon color="action" sx={{ mr: 1 }} />
              <Typography variant="h6">Appearance</Typography>
            </Box>
            <FormControlLabel
              control={<Switch checked={darkMode} onChange={toggleDarkMode} />}
              label={darkMode ? "Dark Mode" : "Light Mode"}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" alignItems="center" mb={2}>
              <NotificationsIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Notification Settings</Typography>
            </Box>
            <FormControlLabel
              control={<Switch checked={settings.notifications.email} onChange={() => handleNotificationChange('email')} />}
              label="Email Notifications"
            />
            <FormControlLabel
              control={<Switch checked={settings.notifications.sms} onChange={() => handleNotificationChange('sms')} />}
              label="SMS Notifications"
            />
            <FormControlLabel
              control={<Switch checked={settings.notifications.criticalAlerts} onChange={() => handleNotificationChange('criticalAlerts')} />}
              label="Critical Alerts Only"
            />
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" alignItems="center" mb={2}>
              <WarningIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">Alert Thresholds</Typography>
            </Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Set thresholds for power consumption and cost alerts. When these values are exceeded, notifications will be triggered based on your notification settings.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" mb={1}>
                  <PowerIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="subtitle2">Power Alert Threshold</Typography>
                </Box>
                <TextField
                  fullWidth
                  type="number"
                  value={settings.thresholds.powerAlert || ''}
                  onChange={(e) => handleThresholdChange('powerAlert', e.target.value)}
                  InputProps={{
                    endAdornment: <Typography variant="caption">W</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" mb={1}>
                  <MoneyIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="subtitle2">Cost Alert Threshold</Typography>
                </Box>
                <TextField
                  fullWidth
                  type="number"
                  value={settings.thresholds.costAlert || ''}
                  onChange={(e) => handleThresholdChange('costAlert', e.target.value)}
                  InputProps={{
                    endAdornment: <Typography variant="caption">$</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" mb={1}>
                  <WarningIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="subtitle2">Critical Power Threshold</Typography>
                </Box>
                <TextField
                  fullWidth
                  type="number"
                  value={settings.thresholds.criticalThreshold || ''}
                  onChange={(e) => handleThresholdChange('criticalThreshold', e.target.value)}
                  InputProps={{
                    endAdornment: <Typography variant="caption">W</Typography>
                  }}
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" alignItems="center" mb={2}>
              <InfoIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="h6">System Settings</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="subtitle2">Data Refresh Interval</Typography>
                </Box>
                <TextField
                  fullWidth
                  type="number"
                  value={settings.thresholds.dataRefreshInterval || ''}
                  onChange={(e) => handleThresholdChange('dataRefreshInterval', e.target.value)}
                  InputProps={{
                    endAdornment: <Typography variant="caption">seconds</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="subtitle2">Time Zone</Typography>
                </Box>
                <TextField
                  fullWidth
                  value={settings.thresholds.timeZone || ''}
                  onChange={(e) => handleThresholdChange('timeZone', e.target.value)}
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Settings;