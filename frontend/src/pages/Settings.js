import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  AttachMoney as MoneyIcon,
  Power as PowerIcon,
} from '@mui/icons-material';

const Settings = () => {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      sms: true,
      criticalAlerts: true,
    },
    thresholds: {
      powerAlert: 100, // kW
      costAlert: 500, // $
      criticalThreshold: 150, // kW
      dataRefreshInterval: 30, // seconds
      timeZone: 'UTC',
    }
  });

  const handleThresholdChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      thresholds: {
        ...prev.thresholds,
        [field]: value
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

  const handleSave = () => {
    // Here you would typically save to backend
    console.log('Saving settings:', settings);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Notification Settings */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" mb={2}>
              <NotificationsIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">
                Notification Settings
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch 
                  checked={settings.notifications.email}
                  onChange={() => handleNotificationChange('email')}
                />
              }
              label="Email Notifications"
            />
            <FormControlLabel
              control={
                <Switch 
                  checked={settings.notifications.sms}
                  onChange={() => handleNotificationChange('sms')}
                />
              }
              label="SMS Notifications"
            />
            <FormControlLabel
              control={
                <Switch 
                  checked={settings.notifications.criticalAlerts}
                  onChange={() => handleNotificationChange('criticalAlerts')}
                />
              }
              label="Critical Alerts"
            />
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Alert Thresholds */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" mb={2}>
              <WarningIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">
                Alert Thresholds
              </Typography>
            </Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Set thresholds for power consumption and cost alerts. When these values are exceeded, notifications will be triggered based on your notification settings.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" mb={1}>
                  <PowerIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle2">Power Alert</Typography>
                  <Tooltip title="System will send an alert when power consumption exceeds this value">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <TextField
                  fullWidth
                  type="number"
                  value={settings.thresholds.powerAlert}
                  onChange={(e) => handleThresholdChange('powerAlert', e.target.value)}
                  InputProps={{
                    endAdornment: <Typography variant="caption">kW</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" mb={1}>
                  <MoneyIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="subtitle2">Cost Alert</Typography>
                  <Tooltip title="System will send an alert when daily cost exceeds this value">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <TextField
                  fullWidth
                  type="number"
                  value={settings.thresholds.costAlert}
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
                  <Tooltip title="System will send a critical alert when power consumption exceeds this value">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <TextField
                  fullWidth
                  type="number"
                  value={settings.thresholds.criticalThreshold}
                  onChange={(e) => handleThresholdChange('criticalThreshold', e.target.value)}
                  InputProps={{
                    endAdornment: <Typography variant="caption">kW</Typography>
                  }}
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* System Settings */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" mb={2}>
              <InfoIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="h6">
                System Settings
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="subtitle2">Data Refresh Interval</Typography>
                  <Tooltip title="How often the system updates power consumption data">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <TextField
                  fullWidth
                  type="number"
                  value={settings.thresholds.dataRefreshInterval}
                  onChange={(e) => handleThresholdChange('dataRefreshInterval', e.target.value)}
                  InputProps={{
                    endAdornment: <Typography variant="caption">seconds</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="subtitle2">Time Zone</Typography>
                  <Tooltip title="Time zone for all timestamps and alerts">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <TextField
                  fullWidth
                  value={settings.thresholds.timeZone}
                  onChange={(e) => handleThresholdChange('timeZone', e.target.value)}
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined">Cancel</Button>
              <Button variant="contained" color="primary" onClick={handleSave}>
                Save Changes
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Settings; 