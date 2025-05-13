import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Grid,
  Chip,
  Stack,
} from '@mui/material';
import {
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Power as PowerIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';

const DeviceList = ({ devices, onDeviceClick }) => {
  const getHealthIcon = (health) => {
    switch (health) {
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

  const getHealthChip = (health) => {
    switch (health) {
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

  const getStatusChip = (status) => {
    switch (status) {
      case 'active':
        return <Chip label="Active" color="success" size="small" />;
      case 'inactive':
        return <Chip label="Inactive" color="default" size="small" />;
      case 'maintenance':
        return <Chip label="Maintenance" color="warning" size="small" />;
      default:
        return <Chip label="Unknown" color="default" size="small" />;
    }
  };

  return (
    <Grid container spacing={3}>
      {devices.map((device) => (
        <Grid item xs={12} md={6} lg={4} key={device.id}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  {device.name}
                </Typography>
                <Stack direction="row" spacing={1}>
                  {getHealthChip(device.health)}
                  {getStatusChip(device.status)}
                </Stack>
              </Box>
              
              <Stack spacing={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <PowerIcon color="action" fontSize="small" />
                  <Typography color="textSecondary">
                    Type: {device.type}
                  </Typography>
                </Box>
                
                <Box display="flex" alignItems="center" gap={1}>
                  <LocationIcon color="action" fontSize="small" />
                  <Typography color="textSecondary">
                    Location: {device.location}
                  </Typography>
                </Box>
                
                <Box display="flex" alignItems="center" gap={1}>
                  {getHealthIcon(device.health)}
                  <Typography variant="body2" color="textSecondary">
                    Last Updated: {new Date().toLocaleTimeString()}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={() => onDeviceClick && onDeviceClick(device)}
              >
                Edit
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default DeviceList; 