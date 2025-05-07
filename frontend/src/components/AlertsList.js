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
  Button,
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
import API from '../API';

function AlertsList({ alerts, onAlertsChange }) {
  const [expandedAlert, setExpandedAlert] = React.useState(null);
  const [resolvingId, setResolvingId] = React.useState(null);

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

  const handleExpandClick = (alert_Id) => {
    setExpandedAlert(expandedAlert === alert_Id ? null : alert_Id);
  };

  const handleResolveAlert = async (alert_Id) => {
    console.log("Attempting to resolve. alert_Id received by handleResolveAlert:", alert_Id);
    setResolvingId(alert_Id);
    try {
      const response = await API.post(`/api/alert/${alert_Id}/resolve`);
      const updatedAlertFromServer = response.data; 
      
      if (onAlertsChange) {
        onAlertsChange(prevAlerts => 
          prevAlerts.map(alert => 
            alert._id === alert_Id ? { ...alert, ...updatedAlertFromServer, resolved: true, end_time: updatedAlertFromServer.end_time } : alert
          )
        );
      }

      window.location.reload();

    } catch (error) {
      console.error("Error resolving alert:", error);
      setResolvingId(null);
    }
  };

  return (
    <List>
      {alerts.map((alert) => (
        <Card key={alert._id} sx={{ mb: 2, borderLeft: `4px solid ${getSeverityColor(alert.type)}` }}>
          <ListItem
            button
            onClick={() => handleExpandClick(alert._id)}
            sx={{
              opacity: alert.resolved ? 0.7 : 1,
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
                  <Typography variant="subtitle1" sx={{ textDecoration: alert.resolved ? 'line-through' : 'none' }}>
                    {alert.message}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    {alert.resolved && (
                      <Chip 
                        label="RESOLVED"
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                    )}
                    <Chip
                      label={alert.type.toUpperCase()}
                      color={getSeverityColor(alert.type)}
                      size="small"
                    />
                  </Box>
                </Box>
              }
              secondary={
                <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
                  <LocationIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="textSecondary">
                    {alert.location || 'Unknown Location'}
                  </Typography>
                  <DeviceIcon fontSize="small" color="action" sx={{ ml: 1 }} />
                  <Typography variant="body2" color="textMuted">
                    {alert.deviceName || 'Unknown Device'}
                  </Typography>
                  <ScheduleIcon fontSize="small" color="action" sx={{ ml: 1 }} />
                  <Typography variant="body2" color="textMuted">
                    {formatTimestamp(alert.start_time)}
                  </Typography>
                </Box>
              }
            />
            <IconButton>
              {expandedAlert === alert._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </ListItem>
          
          <Collapse in={expandedAlert === alert._id} timeout="auto" unmountOnExit>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Alert Details
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocationIcon color="action" />
                    <Typography variant="body2">
                      Location: {alert.location || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <DeviceIcon color="action" />
                    <Typography variant="body2">
                      Device: {alert.deviceName || 'Unknown Device'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <ScheduleIcon color="action" />
                    <Typography variant="body2">
                      Time: {formatTimestamp(alert.start_time)}
                    </Typography>
                  </Box>
                </Grid>
                {alert.end_time && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <ScheduleIcon color="action" />
                      <Typography variant="body2">
                        Ended: {formatTimestamp(alert.end_time)}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Details: {alert.description || alert.message || 'No additional details available.'}
                  </Typography>
                </Grid>
                {!alert.resolved && (
                  <Grid item xs={12} sx={{ mt: 1, textAlign: 'right' }}>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      size="small"
                      onClick={() => {
                        console.log("Resolve button clicked. Full alert object:", JSON.parse(JSON.stringify(alert)));
                        console.log("Value of alert._id BEFORE calling handleResolveAlert:", alert._id);
                        handleResolveAlert(alert._id);
                      }}
                      disabled={resolvingId === alert._id}
                    >
                      {resolvingId === alert._id ? 'Resolving...' : 'Resolve Alert'}
                    </Button>
                  </Grid>
                )}
                {alert.resolved && alert.end_time && (
                   <Grid item xs={12} sx={{ mt: 1 }}>
                     <Typography variant="caption" color="textSecondary">
                       Resolved on: {new Date(alert.end_time).toLocaleString()}
                     </Typography>
                   </Grid>
                )}
              </Grid>
            </CardContent>
          </Collapse>
        </Card>
      ))}
    </List>
  );
}

export default AlertsList; 