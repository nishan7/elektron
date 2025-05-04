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
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import API from '../API';
import config from '../config';

// Components
import DeviceDetails from '../components/DeviceDetails';
import DeviceList from '../components/DeviceList';

// Sample devices data
const sampleDevices = [
  {
    id: '1',
    name: 'HVAC Unit 1',
    type: 'HVAC',
    status: 'active',
    health: 'good',
    location: 'Floor 1',
    model: 'HVAC-2000',
    manufacturer: 'CoolTech',
    firmware_version: '2.1.0',
    is_active: true
  },
  {
    id: '2',
    name: 'Lighting Panel A',
    type: 'Lighting',
    status: 'active',
    health: 'warning',
    location: 'Floor 2',
    model: 'LP-100',
    manufacturer: 'BrightTech',
    firmware_version: '1.5.2',
    is_active: true
  },
  {
    id: '3',
    name: 'Server Room UPS',
    type: 'UPS',
    status: 'active',
    health: 'critical',
    location: 'Basement',
    model: 'UPS-5000',
    manufacturer: 'PowerSafe',
    firmware_version: '3.0.1',
    is_active: true
  },
  {
    id: '4',
    name: 'Main Distribution Panel',
    type: 'Panel',
    status: 'active',
    health: 'good',
    location: 'Utility Room',
    model: 'MDP-200',
    manufacturer: 'PowerGrid',
    firmware_version: '1.0.0',
    is_active: true
  },
  {
    id: '5',
    name: 'Solar Inverter',
    type: 'Inverter',
    status: 'active',
    health: 'good',
    location: 'Roof',
    model: 'SI-3000',
    manufacturer: 'SunPower',
    firmware_version: '2.0.0',
    is_active: true
  }
];

function DevicesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({
    name: '',
    device_type: '',
    location: '',
    model: '',
    manufacturer: '',
    firmware_version: '',
  });

  useEffect(() => {
    setLoading(true);
    API.get('/api/device')
      .then((response) => {
        setDevices(response.data);
        setLoading(false);
      })
      .catch((error) => {
        // setError('Failed to fetch devices');
        setDevices(sampleDevices)
        setLoading(false);
      });
  }, []);

  const handleDeviceClick = (device) => {
    setSelectedDevice(device);
    setEditDialogOpen(true);
  };

  const handleAddClick = () => {
    setAddDialogOpen(true);
  };

  const handleAddClose = () => {
    setAddDialogOpen(false);
  };

  const handleAddSubmit = async () => {
    try {
      // Simulate API call
      const newDeviceWithId = {
        ...newDevice,
        id: String(devices.length + 1),
        status: 'active',
        health: 'good',
        is_active: true
      };
      setDevices([...devices, newDeviceWithId]);
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

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setSelectedDevice(null);
  };

  const handleEditSubmit = async () => {
    try {
      // Simulate API call
      const updatedDevice = {
        ...selectedDevice,
        ...newDevice,
      };
      setDevices(devices.map(device => 
        device.id === updatedDevice.id ? updatedDevice : device
      ));
      setEditDialogOpen(false);
      setSelectedDevice(null);
    } catch (err) {
      setError('Failed to update device');
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
        <Typography variant="h6">
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
        <Grid item xs={12}>
          <DeviceList devices={devices} onDeviceClick={handleDeviceClick} />
        </Grid>
      </Grid>

      {selectedDevice && (
        <DeviceDetails
          deviceId={selectedDevice.id}
          onDeviceUpdated={handleDeviceUpdated}
          onDeviceDeleted={handleDeviceDeleted}
        />
      )}

      <Dialog open={addDialogOpen} onClose={handleAddClose} maxWidth="sm" fullWidth>
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

      <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Device</DialogTitle>
        <DialogContent>
          {selectedDevice && (
            <>
              <TextField
                autoFocus
                margin="dense"
                label="Device Name"
                fullWidth
                defaultValue={selectedDevice.name}
                onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Device Type"
                fullWidth
                defaultValue={selectedDevice.type}
                onChange={(e) => setNewDevice({ ...newDevice, device_type: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Location"
                fullWidth
                defaultValue={selectedDevice.location}
                onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Model"
                fullWidth
                defaultValue={selectedDevice.model}
                onChange={(e) => setNewDevice({ ...newDevice, model: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Manufacturer"
                fullWidth
                defaultValue={selectedDevice.manufacturer}
                onChange={(e) => setNewDevice({ ...newDevice, manufacturer: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Firmware Version"
                fullWidth
                defaultValue={selectedDevice.firmware_version}
                onChange={(e) => setNewDevice({ ...newDevice, firmware_version: e.target.value })}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DevicesPage; 