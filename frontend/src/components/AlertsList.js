import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

function AlertsList({ alerts = [] }) {
  const getSeverityIcon = (type) => {
    switch (type) {
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'info':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getSeverityColor = (type) => {
    switch (type) {
      case 'warning':
        return 'warning.main';
      case 'critical':
        return 'error.main';
      case 'info':
        return 'info.main';
      default:
        return 'text.secondary';
    }
  };

  return (
    <List>
      {alerts.map((alert) => (
        <ListItem
          key={alert.id}
          divider
          sx={{
            borderLeft: 4,
            borderColor: getSeverityColor(alert.type),
            mb: 1,
          }}
        >
          <ListItemIcon>
            {getSeverityIcon(alert.type)}
          </ListItemIcon>
          <ListItemText
            primary={
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2">
                  {alert.deviceName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                </Typography>
              </Box>
            }
            secondary={
              <Typography variant="body2" color="text.secondary">
                {alert.message}
              </Typography>
            }
          />
        </ListItem>
      ))}
      {alerts.length === 0 && (
        <ListItem>
          <ListItemText
            primary="No alerts"
            secondary="All systems are operating normally"
          />
        </ListItem>
      )}
    </List>
  );
}

export default AlertsList; 