import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  NotificationsActive as NotificationsActiveIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from 'axios';
import config from '../config';

// Create alert item as memoized component to prevent unnecessary re-renders
const AlertItem = React.memo(({ alert, index, totalAlerts, globalSettings, getSeverityIcon, getSeverityChip, formatTimestamp, updateMessageWithCurrentThreshold }) => {
  return (
    <React.Fragment>
      <ListItem sx={{ px: 0 }}>
        <ListItemIcon sx={{ minWidth: '40px' }}>
          {getSeverityIcon(alert.severity)}
        </ListItemIcon>
        <ListItemText
          primary={
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body1">
                {updateMessageWithCurrentThreshold(alert.message, globalSettings)}
              </Typography>
              {getSeverityChip(alert.severity)}
            </Box>
          }
          secondary={
            <Box>
              <Typography variant="body2" color="textSecondary">
                {`Device: ${alert.deviceName} | ${formatTimestamp(alert.timestamp)}`}
              </Typography>
              {alert.value && (
                <Typography variant="body2" color="textSecondary">
                  {`Power: ${typeof alert.value === 'number' ? alert.value.toFixed(1) : alert.value}W (Threshold: ${
                    globalSettings.alertThreshold ? 
                    (Number.isInteger(globalSettings.alertThreshold) ? 
                      globalSettings.alertThreshold : 
                      globalSettings.alertThreshold.toFixed(1)) : 
                    (alert.threshold || 0)
                  }W)`}
                </Typography>
              )}
            </Box>
          }
          secondaryTypographyProps={{ component: 'div' }}
        />
      </ListItem>
      {index < totalAlerts - 1 && <Divider component="li" />}
    </React.Fragment>
  );
});

function RecentAlerts() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [devices, setDevices] = useState({});
  const [globalSettings, setGlobalSettings] = useState({ alertThreshold: 12 });
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  
  // Refs to track previous data and avoid unnecessary re-renders
  const prevAlertsRef = useRef(null);
  const prevSettingsRef = useRef(null);
  const dataUpdatedRef = useRef(false);
  const isInitialMount = useRef(true);

  // Convert fetching functions to useCallback to prevent unnecessary recreations
  const fetchSettings = useCallback(async () => {
    try {
      const settingsResponse = await axios.get(`${config.apiUrl}/api/settings`);
      if (settingsResponse.data) {
        if (JSON.stringify(settingsResponse.data) !== JSON.stringify(prevSettingsRef.current)) {
          setGlobalSettings(prev => {
            prevSettingsRef.current = settingsResponse.data;
            dataUpdatedRef.current = true;
            return settingsResponse.data;
          });
        }
      }
    } catch (settingsError) {
      console.error("Error fetching settings:", settingsError);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const devicesResponse = await axios.get(`${config.apiUrl}/api/device/`);
      const deviceMap = devicesResponse.data.reduce((map, device) => {
        map[device._id] = device.name;
        return map;
      }, {});
      
      // Only update devices state if it actually changed
      if (JSON.stringify(deviceMap) !== JSON.stringify(devices)) {
        setDevices(deviceMap);
      }
      
      const response = await axios.get(`${config.apiUrl}/api/alerts/`, {
        params: { 
          resolved: false,
          limit: 3
        }
      });
      
      const alertsWithDeviceNames = response.data
        .map(alert => ({
          ...alert,
          deviceName: deviceMap[alert.device_id] || 'Unknown Device'
        }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 3);
      
      // Only update alerts if they've changed
      if (JSON.stringify(alertsWithDeviceNames) !== JSON.stringify(prevAlertsRef.current)) {
        setAlerts(prev => {
          prevAlertsRef.current = alertsWithDeviceNames;
          dataUpdatedRef.current = true;
          return alertsWithDeviceNames;
        });
        setLastUpdateTime(new Date());
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      if (error.response && error.response.status === 404) {
        setError('Failed to fetch alerts: Alerts API endpoint not found.');
      } else {
        setError(`Failed to fetch alerts: ${error.message}`);
      }
      setAlerts([]);
    }
  }, [devices]);

  // Integrate data fetching
  const fetchData = useCallback(async () => {
    if (isInitialMount.current) {
      setLoading(true);
    }
    
    setError(null);
    dataUpdatedRef.current = false;

    try {
      await fetchSettings();
      await fetchAlerts();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      if (isInitialMount.current) {
        setLoading(false);
        isInitialMount.current = false;
      }
    }
  }, [fetchSettings, fetchAlerts]);

  // Initial data fetch and polling
  useEffect(() => {
    fetchData();
    
    // Set up polling interval
    const interval = setInterval(() => {
      fetchData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [fetchData]);

  // Memoize utility functions
  const getSeverityIcon = useCallback((severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  }, []);

  const getSeverityChip = useCallback((severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return <Chip label="Critical" color="error" size="small" />;
      case 'warning':
        return <Chip label="Warning" color="warning" size="small" />;
      default:
        return <Chip label="Info" color="info" size="small" />;
    }
  }, []);

  const formatTimestamp = useCallback((timestamp) => {
    return new Date(timestamp).toLocaleString();
  }, []);

  const updateMessageWithCurrentThreshold = useCallback((message, settings) => {
    if (!message) return message;
    
    const thresholdRegex = /(\(threshold:|\bthreshold:) \d+\.?\d*W/gi;
    
    const formattedThreshold = settings.alertThreshold ? 
      (Number.isInteger(settings.alertThreshold) ? 
        settings.alertThreshold : 
        settings.alertThreshold.toFixed(1)) : 
      "0";
    
    if (thresholdRegex.test(message)) {
      return message.replace(thresholdRegex, (match) => {
        const prefix = match.includes('(') ? '(threshold:' : 'threshold:';
        return `${prefix} ${formattedThreshold}W`;
      });
    }
    
    return message;
  }, []);

  // Memoize the list of alerts to render
  const alertsList = useMemo(() => {
    return alerts.slice(0, 3).map((alert, index) => (
      <AlertItem 
        key={alert.id || index}
        alert={alert}
        index={index}
        totalAlerts={alerts.length}
        globalSettings={globalSettings}
        getSeverityIcon={getSeverityIcon}
        getSeverityChip={getSeverityChip}
        formatTimestamp={formatTimestamp}
        updateMessageWithCurrentThreshold={updateMessageWithCurrentThreshold}
      />
    ));
  }, [alerts, globalSettings, getSeverityIcon, getSeverityChip, formatTimestamp, updateMessageWithCurrentThreshold]);

  return (
    <Card elevation={1} sx={{ height: '100%' }}>
      <CardHeader 
        avatar={<NotificationsActiveIcon />} 
        title={
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Recent Active Alerts</Typography>
            <Typography variant="caption" color="textSecondary">
              Last updated: {lastUpdateTime.toLocaleTimeString()}
            </Typography>
          </Box>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        {loading && alerts.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="150px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 1 }}>
            {error}
          </Alert>
        ) : alerts.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body1" color="textSecondary" align="center">
              No active alerts
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
              Current power threshold: {globalSettings.alertThreshold ? `${globalSettings.alertThreshold}W` : 'Not set'}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {alertsList}
          </List>
        )}
      </CardContent>
    </Card>
  );
}

export default React.memo(RecentAlerts); 