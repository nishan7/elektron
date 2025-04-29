import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import axios from 'axios';
import config from '../config';

function DeviceStatus() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${config.apiUrl}/api/device`);
        setDevices(response.data);
      } catch (error) {
        console.error('Error fetching devices:', error);
        setError('Failed to fetch devices');
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
    const interval = setInterval(fetchDevices, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const getHealthIcon = (healthStatus) => {
    switch (healthStatus) {
      case 'good':
        return <CheckCircleIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'critical':
        return <ErrorIcon color="error" />;
      default:
        return <ErrorIcon color="error" />;
    }
  };

  const getHealthChip = (healthStatus) => {
    switch (healthStatus) {
      case 'good':
        return <Chip label="Healthy" color="success" size="small" />;
      case 'warning':
        return <Chip label="Warning" color="warning" size="small" />;
      case 'critical':
        return <Chip label="Critical" color="error" size="small" />;
      default:
        return <Chip label="Unknown" color="default" size="small" />;
    }
  };

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

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Device Status
      </Typography>
      <List>
        {devices.map((device) => (
          <ListItem
            key={device._id}
            divider
            sx={{
              backgroundColor: device.health?.health_status === 'critical' ? 'error.light' : 'inherit',
            }}
          >
            <ListItemIcon>
              {getHealthIcon(device.health?.health_status)}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle1">{device.name}</Typography>
                  {getHealthChip(device.health?.health_status)}
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Type: {device.device_type}
                  </Typography>
                  {device.health && (
                    <>
                      <Typography variant="body2" color="textSecondary">
                        Temperature: {device.health.temperature}°C
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Load: {device.health.load_percentage}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Voltage Fluctuation: {device.health.voltage_fluctuation}%
                      </Typography>
                    </>
                  )}
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}

export default DeviceStatus; 