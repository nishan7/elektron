import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import axios from 'axios';
import config from '../config';

function DeviceDetails({ deviceId, onDeviceUpdated, onDeviceDeleted }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [device, setDevice] = useState(null);
  const [health, setHealth] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [thresholdDialogOpen, setThresholdDialogOpen] = useState(false);
  const [powerThreshold, setPowerThreshold] = useState('');
  const [editForm, setEditForm] = useState({
    name: '',
    device_type: '',
    location: '',
    model: '',
    manufacturer: '',
    firmware_version: '',
  });

  useEffect(() => {
    const fetchDeviceDetails = async () => {
      if (!deviceId) return;
      
      try {
        setLoading(true);
        
        // Fetch device details
        const deviceResponse = await axios.get(`${config.apiUrl}/api/device/${deviceId}`);
        setDevice(deviceResponse.data);
        
        // Set power threshold if exists
        if (deviceResponse.data.power_threshold) {
          setPowerThreshold(deviceResponse.data.power_threshold.toString());
        }
        
        // Initialize edit form
        setEditForm({
          name: deviceResponse.data.name,
          device_type: deviceResponse.data.device_type,
          location: deviceResponse.data.location || '',
          model: deviceResponse.data.model || '',
          manufacturer: deviceResponse.data.manufacturer || '',
          firmware_version: deviceResponse.data.firmware_version || '',
        });
        
        // Fetch latest health metrics
        const healthResponse = await axios.get(`${config.apiUrl}/api/device/${deviceId}/health?limit=1`);
        if (healthResponse.data.length > 0) {
          setHealth(healthResponse.data[0]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching device details:', err);
        setError('Failed to load device details');
        setLoading(false);
      }
    };

    fetchDeviceDetails();
  }, [deviceId]);

  const handleEditClick = () => {
    setEditDialogOpen(true);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
  };

  const handleDeleteClose = () => {
    setDeleteDialogOpen(false);
  };

  const handleEditSubmit = async () => {
    try {
      setLoading(true);
      const response = await axios.put(`${config.apiUrl}/api/device/${deviceId}`, editForm);
      setDevice(response.data);
      setEditDialogOpen(false);
      if (onDeviceUpdated) {
        onDeviceUpdated(response.data);
      }
    } catch (err) {
      console.error('Error updating device:', err);
      setError('Failed to update device');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    try {
      setLoading(true);
      await axios.delete(`${config.apiUrl}/api/device/${deviceId}`);
      setDeleteDialogOpen(false);
      if (onDeviceDeleted) {
        onDeviceDeleted(deviceId);
      }
    } catch (err) {
      console.error('Error deleting device:', err);
      setError('Failed to delete device');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: value,
    });
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

  const handleThresholdClick = () => {
    setThresholdDialogOpen(true);
  };

  const handleThresholdClose = () => {
    setThresholdDialogOpen(false);
  };

  const handleThresholdSubmit = async () => {
    try {
      setLoading(true);
      
      // Update the device's power threshold
      const result = await axios.put(`${config.apiUrl}/api/device/${deviceId}`, {
        power_threshold: parseFloat(powerThreshold)
      });
      
      setDevice({
        ...device,
        power_threshold: parseFloat(powerThreshold)
      });
      
      setThresholdDialogOpen(false);
      if (onDeviceUpdated) {
        onDeviceUpdated(result.data);
      }
    } catch (err) {
      console.error('Error updating power threshold:', err);
      setError('Failed to update power threshold');
    } finally {
      setLoading(false);
    }
  };

  const handleThresholdChange = (e) => {
    // Only allow numeric values
    const value = e.target.value;
    if (!isNaN(value) || value === '') {
      setPowerThreshold(value);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
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

  if (!device) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No device selected
      </Alert>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Device Details
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEditClick}
              sx={{ mr: 1 }}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteClick}
            >
              Delete
            </Button>
          </Box>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Basic Information
                </Typography>
                <Box mb={1}>
                  <Typography variant="body2" color="textSecondary">
                    Name
                  </Typography>
                  <Typography variant="body1">
                    {device.name}
                  </Typography>
                </Box>
                <Box mb={1}>
                  <Typography variant="body2" color="textSecondary">
                    Type
                  </Typography>
                  <Typography variant="body1">
                    {device.device_type}
                  </Typography>
                </Box>
                <Box mb={1}>
                  <Typography variant="body2" color="textSecondary">
                    Location
                  </Typography>
                  <Typography variant="body1">
                    {device.location || 'Not specified'}
                  </Typography>
                </Box>
                <Box mb={1}>
                  <Typography variant="body2" color="textSecondary">
                    Model
                  </Typography>
                  <Typography variant="body1">
                    {device.model || 'Not specified'}
                  </Typography>
                </Box>
                <Box mb={1}>
                  <Typography variant="body2" color="textSecondary">
                    Manufacturer
                  </Typography>
                  <Typography variant="body1">
                    {device.manufacturer || 'Not specified'}
                  </Typography>
                </Box>
                <Box mb={1}>
                  <Typography variant="body2" color="textSecondary">
                    Firmware Version
                  </Typography>
                  <Typography variant="body1">
                    {device.firmware_version || 'Not specified'}
                  </Typography>
                </Box>
                <Box mb={1}>
                  <Typography variant="body2" color="textSecondary">
                    Status
                  </Typography>
                  <Chip 
                    label={device.is_active ? 'Active' : 'Inactive'} 
                    color={device.is_active ? 'success' : 'default'} 
                    size="small" 
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Health Metrics
                </Typography>
                
                {health ? (
                  <Box>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Box mr={1}>
                        {getHealthIcon(health.health_status)}
                      </Box>
                      <Typography variant="body1">
                        {health.health_status.charAt(0).toUpperCase() + health.health_status.slice(1)}
                      </Typography>
                      <Box ml={1}>
                        {getHealthChip(health.health_status)}
                      </Box>
                    </Box>
                    
                    <Box mb={1}>
                      <Typography variant="body2" color="textSecondary">
                        Temperature
                      </Typography>
                      <Typography variant="body1">
                        {health.temperature.toFixed(1)}°C
                      </Typography>
                    </Box>
                    
                    <Box mb={1}>
                      <Typography variant="body2" color="textSecondary">
                        Load Percentage
                      </Typography>
                      <Typography variant="body1">
                        {health.load_percentage.toFixed(1)}%
                      </Typography>
                    </Box>
                    
                    <Box mb={1}>
                      <Typography variant="body2" color="textSecondary">
                        Voltage Fluctuation
                      </Typography>
                      <Typography variant="body1">
                        {health.voltage_fluctuation.toFixed(1)}%
                      </Typography>
                    </Box>
                    
                    <Box mb={1}>
                      <Typography variant="body2" color="textSecondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body1">
                        {new Date(health.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography color="textSecondary">
                    No health data available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Power Management
                </Typography>
                
                <Box mb={1} display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Maximum Power
                    </Typography>
                    <Typography variant="body1">
                      {device.max ? `${device.max.toFixed(1)}W` : 'Not recorded yet'}
                    </Typography>
                  </Box>
                </Box>
                
                <Box mb={1} display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Power Threshold Alert
                    </Typography>
                    <Typography variant="body1">
                      {device.power_threshold ? `${device.power_threshold.toFixed(1)}W` : 'Not set'}
                    </Typography>
                  </Box>
                  <Tooltip title="Set power threshold for alerts">
                    <IconButton size="small" onClick={handleThresholdClick}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditClose}>
        <DialogTitle>Edit Device</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Name"
            type="text"
            fullWidth
            value={editForm.name}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="device_type"
            label="Device Type"
            type="text"
            fullWidth
            value={editForm.device_type}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="location"
            label="Location"
            type="text"
            fullWidth
            value={editForm.location}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="model"
            label="Model"
            type="text"
            fullWidth
            value={editForm.model}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="manufacturer"
            label="Manufacturer"
            type="text"
            fullWidth
            value={editForm.manufacturer}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="firmware_version"
            label="Firmware Version"
            type="text"
            fullWidth
            value={editForm.firmware_version}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleEditSubmit} color="primary">Save</Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteClose}>
        <DialogTitle>Delete Device</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this device? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>Cancel</Button>
          <Button onClick={handleDeleteSubmit} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Power Threshold Dialog */}
      <Dialog open={thresholdDialogOpen} onClose={handleThresholdClose}>
        <DialogTitle>Set Power Threshold</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Power Threshold (W)"
              variant="outlined"
              name="powerThreshold"
              value={powerThreshold}
              onChange={handleThresholdChange}
              helperText="An alert will be triggered when power exceeds this value"
              type="number"
              InputProps={{
                endAdornment: <Typography variant="body2">W</Typography>,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleThresholdClose}>Cancel</Button>
          <Button 
            onClick={handleThresholdSubmit} 
            color="primary" 
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={powerThreshold === ''}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DeviceDetails; 