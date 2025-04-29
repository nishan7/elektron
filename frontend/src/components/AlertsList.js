import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Chip,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import axios from 'axios';
import config from '../config';

const AlertsList = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getSeverityIcon = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getSeverityChip = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <Chip label="Critical" color="error" size="small" />;
      case 'warning':
        return <Chip label="Warning" color="warning" size="small" />;
      default:
        return <Chip label="Info" color="info" size="small" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        // First get all devices
        const devicesResponse = await axios.get(`${config.apiUrl}/api/device`);
        const devices = devicesResponse.data;
        
        // Then fetch alerts for each device
        const alertsPromises = devices.map(device => 
          axios.get(`${config.apiUrl}/api/alerts/${device._id}`, {
            params: { resolved: false, limit: 10 }
          })
        );
        
        const alertsResponses = await Promise.all(alertsPromises);
        const allAlerts = alertsResponses.flatMap(response => response.data);
        
        // Sort alerts by timestamp
        const sortedAlerts = allAlerts.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        setAlerts(sortedAlerts);
      } catch (error) {
        console.error('Error fetching alerts:', error);
        setError('Failed to fetch alerts');
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (alerts.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body1" color="textSecondary" align="center">
          No active alerts
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {alerts.map((alert, index) => (
        <React.Fragment key={alert.id}>
          <ListItem>
            <ListItemIcon>
              {getSeverityIcon(alert.severity)}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle1">
                    {alert.message}
                  </Typography>
                  {getSeverityChip(alert.severity)}
                </Box>
              }
              secondary={
                <Typography variant="body2" color="textSecondary">
                  {formatTimestamp(alert.timestamp)}
                </Typography>
              }
            />
          </ListItem>
          {index < alerts.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </List>
  );
};

export default AlertsList; 