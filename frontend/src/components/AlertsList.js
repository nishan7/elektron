import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  DeviceHub as DeviceIcon,
} from '@mui/icons-material';

function AlertsList({ alerts }) {
  const [expandedAlert, setExpandedAlert] = React.useState(null);

  const getSeverityIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
        return <InfoIcon color="info" />;
      default:
        return <CheckCircleIcon color="success" />;
    }
  };

  const getSeverityColor = (type) => {
    switch (type.toLowerCase()) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'success';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    // More than 24 hours
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleExpandClick = (alertId) => {
    setExpandedAlert(expandedAlert === alertId ? null : alertId);
  };

  return (
    <List>
      {alerts.map((alert) => (
        <Card key={alert.id} sx={{ mb: 2, borderLeft: `4px solid ${getSeverityColor(alert.type)}` }}>
          <ListItem
            button
            onClick={() => handleExpandClick(alert.id)}
            sx={{
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <ListItemIcon>
              {getSeverityIcon(alert.type)}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle1">
                    {alert.message}
                  </Typography>
                  <Chip
                    label={alert.type.toUpperCase()}
                    color={getSeverityColor(alert.type)}
                    size="small"
                  />
                </Box>
              }
              secondary={
                <Box display="flex" alignItems="center" gap={1}>
                  <DeviceIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="textSecondary">
                    {alert.deviceName}
                  </Typography>
                  <ScheduleIcon fontSize="small" color="action" sx={{ ml: 1 }} />
                  <Typography variant="body2" color="textSecondary">
                    {formatTimestamp(alert.timestamp)}
                  </Typography>
                </Box>
              }
            />
            <IconButton>
              {expandedAlert === alert.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </ListItem>
          
          <Collapse in={expandedAlert === alert.id} timeout="auto" unmountOnExit>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Alert Details
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <DeviceIcon color="action" />
                    <Typography variant="body2">
                      Device: {alert.deviceName}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <ScheduleIcon color="action" />
                    <Typography variant="body2">
                      Time: {formatTimestamp(alert.timestamp)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocationIcon color="action" />
                    <Typography variant="body2">
                      Location: {alert.location || 'Main Building'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    {alert.description || 'No additional details available.'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Collapse>
        </Card>
      ))}
    </List>
  );
}

export default AlertsList; 