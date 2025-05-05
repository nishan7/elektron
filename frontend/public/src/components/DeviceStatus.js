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
import { extractDeviceId, formatDeviceType } from '../utils/deviceUtils';

function DeviceStatus() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${config.apiUrl}/api/device`);
        console.log('Devices from API:', response.data);
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
        return <InfoIcon color="primary" />;
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
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
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Device Status
      </Typography>
      <List>
        {devices && devices.length > 0 ? (
          devices.map((device) => {
            const deviceId = extractDeviceId(device);
            return (
              <ListItem key={deviceId} sx={{ borderBottom: '1px solid #eee' }}>
                <ListItemIcon>
                  {getHealthIcon(device.health_status || 'unknown')}
                </ListItemIcon>
                <ListItemText
                  primary={device.name || 'Unnamed Device'}
                  secondaryTypographyProps={{ component: 'div' }}
                  secondary={
                    <Box display="flex" flexDirection="column" gap={0.5}>
                      <Typography variant="body2" component="span">
                        Type: {formatDeviceType(device.device_type || device.type)}
                      </Typography>
                      {device.location && (
                        <Typography variant="body2" component="span">
                          Location: {device.location}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                {getHealthChip(device.health_status || 'unknown')}
              </ListItem>
            );
          })
        ) : (
          <ListItem>
            <ListItemText
              primary="No devices found"
              secondary="Add devices to monitor their status"
            />
          </ListItem>
        )}
      </List>
    </Paper>
  );
}

export default DeviceStatus; 