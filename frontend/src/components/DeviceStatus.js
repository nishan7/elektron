import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Typography,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

function DeviceStatus({ devices = [] }) {
  console.log("[DeviceStatus] Component rendered/updated. Devices prop:", JSON.parse(JSON.stringify(devices)));

  const getHealthIcon = (healthStatus) => {
    switch (healthStatus || 'unknown') {
      case 'good':
        return <CheckCircleIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'critical':
        return <ErrorIcon color="error" />;
      default:
        return <ErrorIcon color="disabled" />;
    }
  };

  const getHealthChip = (healthStatus) => {
    switch (healthStatus || 'unknown') {
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

  if (!devices || devices.length === 0) {
    return <Typography variant="body2">No device data available.</Typography>;
  }

  return (
    <List>
      {devices.map((device) => (
        <ListItem
          key={device._id || device.id}
          divider
          secondaryAction={getHealthChip(device.health)}
        >
          <ListItemIcon>
            {getHealthIcon(device.health)}
          </ListItemIcon>
          <ListItemText
            primary={device.name}
            secondary={`Type: ${device.type || 'N/A'} | Status: ${device.status || 'N/A'}`}
          />
        </ListItem>
      ))}
    </List>
  );
}

export default DeviceStatus; 