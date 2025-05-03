import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

function DeviceStatus({ devices = [] }) {
  const getHealthIcon = (healthStatus) => {
    switch (healthStatus || 'unknown') {
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

  return (
    <List>
      {devices.map((device) => (
        <ListItem
          key={device.id}
          divider
          secondaryAction={getHealthChip(device.health)}
        >
          <ListItemIcon>
            {getHealthIcon(device.health)}
          </ListItemIcon>
          <ListItemText
            primary={device.name}
            secondary={`Type: ${device.type} | Status: ${device.status}`}
          />
        </ListItem>
      ))}
    </List>
  );
}

export default DeviceStatus; 