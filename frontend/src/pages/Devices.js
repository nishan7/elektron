import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import axios from 'axios';
import config from '../config';

// Components
import DeviceDetails from '../components/DeviceDetails';

function DevicesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({
    name: '',
    device_type: '',
    location: '',
    model: '',
    manufacturer: '',
    firmware_version: '',
  });

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${config.apiUrl}/api/devices`);
      setDevices(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load devices');
      setLoading(false);
    }
  };

  const handleDeviceClick = (device) => {
    setSelectedDevice(device);
  };

  const handleAddClick = () => {
    setAddDialogOpen(true);
  };

  const handleAddClose = () => {
    setAddDialogOpen(false);
  };

  const handleAddSubmit = async () => {
    try {
      const response = await axios.post(`${config.apiUrl}/api/devices`, newDevice);
      setDevices([...devices, response.data]);
      setAddDialogOpen(false);
      setNewDevice({
        name: '',
        device_type: '',
        location: '',
        model: '',
        manufacturer: '',
        firmware_version: '',
      });
    } catch (err) {
      setError('Failed to add device');
    }
  };

  const handleDeviceUpdated = (updatedDevice) => {
    setDevices(devices.map(device => 
      device.id === updatedDevice.id ? updatedDevice : device
    ));
    setSelectedDevice(null);
  };

  const handleDeviceDeleted = (deviceId) => {
    setDevices(devices.filter(device => device.id !== deviceId));
    setSelectedDevice(null);
  };

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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
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
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Devices
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
        >
          Add Device
        </Button>
      </Box>

      <Grid container spacing={3}>
        {devices.map((device) => (
          <Grid item xs={12} md={6} lg={4} key={device.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    {device.name}
                  </Typography>
                  {getHealthChip(device.health_status)}
                </Box>
                <Typography color="textSecondary" gutterBottom>
                  Type: {device.device_type}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  Location: {device.location}
                </Typography>
                <Typography color="textSecondary">
                  Model: {device.model}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleDeviceClick(device)}
                >
                  Details
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {selectedDevice && (
        <DeviceDetails
          deviceId={selectedDevice.id}
          onDeviceUpdated={handleDeviceUpdated}
          onDeviceDeleted={handleDeviceDeleted}
        />
      )}

      <Dialog open={addDialogOpen} onClose={handleAddClose}>
        <DialogTitle>Add New Device</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Device Name"
            fullWidth
            value={newDevice.name}
            onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Device Type"
            fullWidth
            value={newDevice.device_type}
            onChange={(e) => setNewDevice({ ...newDevice, device_type: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Location"
            fullWidth
            value={newDevice.location}
            onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Model"
            fullWidth
            value={newDevice.model}
            onChange={(e) => setNewDevice({ ...newDevice, model: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Manufacturer"
            fullWidth
            value={newDevice.manufacturer}
            onChange={(e) => setNewDevice({ ...newDevice, manufacturer: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Firmware Version"
            fullWidth
            value={newDevice.firmware_version}
            onChange={(e) => setNewDevice({ ...newDevice, firmware_version: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddClose}>Cancel</Button>
          <Button onClick={handleAddSubmit} variant="contained">
            Add Device
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DevicesPage; 