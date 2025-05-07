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
  // console.log("[DeviceStatus] Component rendered/updated. Devices prop:", JSON.parse(JSON.stringify(devices)));

  const getHealthIcon = (healthStatus) => {
    // Uses the healthStatus passed (which will be device.calculatedHealth)
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
    // Uses the healthStatus passed (which will be device.calculatedHealth)
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
          // MODIFIED: Use device.calculatedHealth for the chip
          secondaryAction={getHealthChip(device.calculatedHealth)}
        >
          <ListItemIcon>
            {/* MODIFIED: Use device.calculatedHealth for the icon */}
            {getHealthIcon(device.calculatedHealth)}
          </ListItemIcon>
          <ListItemText
            primary={device.name}
            // MODIFIED: Optionally adjust secondary text if device.status is no longer the primary source of truth for display
            // For now, keeping device.status for informational purposes, but calculatedHealth drives the chip/icon.
            secondary={`Type: ${device.type || 'N/A'} | Status: ${device.status || 'N/A'}`}
          />
        </ListItem>
      ))}
    </List>
  );
}

export default DeviceStatus; 