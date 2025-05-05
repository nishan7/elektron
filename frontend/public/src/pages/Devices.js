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
  Divider,
  Paper,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  PowerSettingsNew as PowerIcon,
  NavigateNext as DetailsIcon,
  DevicesOther as DeviceIcon,
  LocationOn as LocationIcon,
  Memory as ModelIcon,
  Business as ManufacturerIcon,
  Code as FirmwareIcon,
} from '@mui/icons-material';
import axios from 'axios';
import config from '../config';

// Components
import DeviceDetails from '../components/DeviceDetails';

function DevicesPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
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
      const response = await axios.get(`${config.apiUrl}/api/device`);
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
    setError(null);
    try {
      const response = await axios.post(`${config.apiUrl}/api/device/`, newDevice);
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
      console.error('Failed to add device:', err);
      setError(`Failed to add device: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleDeviceUpdated = (updatedDevice) => {
    setDevices(devices.map(device => 
      device._id === updatedDevice.id ? updatedDevice : device
    ));
    setSelectedDevice(null);
  };

  const handleDeviceDeleted = (deviceId) => {
    setDevices(devices.filter(device => device._id !== deviceId));
    setSelectedDevice(null);
  };

  const handleDeleteClick = (device) => {
    setDeviceToDelete(device);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setDeviceToDelete(null);
    setDeleteDialogOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!deviceToDelete) return;
    setDeleteError(null);

    try {
      await axios.delete(`${config.apiUrl}/api/device/${deviceToDelete._id}/`);
      
      setDevices(devices.filter(d => d._id !== deviceToDelete._id));
      
      handleDeleteDialogClose();

    } catch (err) {
      console.error('Failed to delete device:', err);
      setDeleteError(`Failed to delete device: ${err.response?.data?.detail || err.message}`);
    }
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

  // Get device type icon for the card
  const getDeviceTypeIcon = (deviceType) => {
    const type = (deviceType || '').toLowerCase();
    if (type.includes('plug') || type.includes('smart plug')) {
      return <PowerIcon />;
    } else if (type.includes('light') || type.includes('bulb')) {
      return <DeviceIcon />;
    } else {
      return <DeviceIcon />;
    }
  };

  const renderDeviceGrid = () => {
    // Determine grid layout based on device count
    const getGridSize = () => {
      if (devices.length === 1) {
        return { xs: 12, sm: 18, md: 16, lg: 16 };
      } else if (devices.length === 2) {
        return { xs: 12, sm: 6, md: 6, lg: 6 };
      } else if (devices.length <= 6) {
        return { xs: 12, sm: 6, md: 4, lg: 4 };
      } else {
        return { xs: 12, sm: 6, md: 4, lg: 3 };
      }
    };

    const gridSize = getGridSize();

    return (
      <Grid container spacing={3} justifyContent={devices.length <= 3 ? "center" : "flex-start"}>
        {devices.map((device) => (
          <Grid item {...gridSize} key={device._id}>
            <Card 
              elevation={2}
              sx={{ 
                borderRadius: '12px',
                transition: 'all 0.3s',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': {
                  boxShadow: theme.shadows[8],
                  transform: 'translateY(-4px)'
                }
              }}
            >
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 12, 
                  right: 12, 
                  zIndex: 1,
                }}
              >
                {getHealthChip(device.health_status || 'unknown')}
              </Box>
              
              <CardContent sx={{ p: 3, flexGrow: 1 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar 
                    sx={{ 
                      mr: 2, 
                      bgcolor: theme.palette.primary.main + '20',
                      color: theme.palette.primary.main,
                      width: 60,
                      height: 60,
                    }}
                  >
                    {getDeviceTypeIcon(device.device_type)}
                  </Avatar>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      flexGrow: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {device.name || 'Unnamed Device'}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={devices.length === 1 ? 4 : 12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <DeviceIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />
                      <Typography variant="body2" color="text.secondary">Type</Typography>
                    </Box>
                    <Typography variant="body1" sx={{ ml: 3.5, fontWeight: 500 }}>
                      {device.device_type || 'Not specified'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={devices.length === 1 ? 4 : 12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <LocationIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />
                      <Typography variant="body2" color="text.secondary">Location</Typography>
                    </Box>
                    <Typography variant="body1" sx={{ ml: 3.5, fontWeight: 500 }}>
                      {device.location || 'Not specified'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={devices.length === 1 ? 4 : 12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <ModelIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />
                      <Typography variant="body2" color="text.secondary">Model</Typography>
                    </Box>
                    <Typography variant="body1" sx={{ ml: 3.5, fontWeight: 500 }}>
                      {device.model || 'Not specified'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
              
              <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between', borderTop: `1px solid ${theme.palette.divider}` }}>
                <Box>
                  <Tooltip title="Delete device">
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeleteClick(device)}
                      sx={{ 
                        mr: 1,
                        color: theme.palette.error.main,
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit device">
                    <IconButton 
                      size="small"
                      onClick={() => handleDeviceClick(device)}
                      sx={{ 
                        color: theme.palette.primary.main,
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Button 
                  variant="outlined" 
                  endIcon={<DetailsIcon />}
                  size="small"
                  onClick={() => handleDeviceClick(device)}
                  sx={{ 
                    borderRadius: 20,
                    px: 2,
                  }}
                >
                  Details
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          py: 2,
          px: 3, 
          mb: 4, 
          borderRadius: '12px',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: theme.palette.background.paper,
          boxShadow: theme.shadows[1],
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
          Devices
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
          sx={{ 
            borderRadius: 20,
            px: 3,
            py: 1,
            boxShadow: 2,
            textTransform: 'none',
            fontWeight: 500,
            '&:hover': {
              boxShadow: 4,
            },
          }}
        >
          Add Device
        </Button>
      </Paper>

      {devices.length === 0 ? (
        <Paper 
          sx={{ 
            p: 4, 
            textAlign: 'center', 
            borderRadius: '12px', 
            borderStyle: 'dashed',
            borderWidth: 1,
            borderColor: theme.palette.divider,
            my: 3,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <DeviceIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No devices found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
            Start monitoring your electricity usage by adding your first device
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
            sx={{ borderRadius: 20, textTransform: 'none' }}
          >
            Add Device
          </Button>
        </Paper>
      ) : (
        <>
          {renderDeviceGrid()}
          
          {selectedDevice && (
            <Paper 
              elevation={1}
              sx={{ 
                mt: 4, 
                p: 3, 
                borderRadius: '12px',
                backgroundColor: theme.palette.background.paper
              }}
            >
              <DeviceDetails
                deviceId={selectedDevice._id}
                onDeviceUpdated={handleDeviceUpdated}
                onDeviceDeleted={handleDeviceDeleted}
              />
            </Paper>
          )}
        </>
      )}

      {/* Add Device Dialog */}
      <Dialog open={addDialogOpen} onClose={handleAddClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>Add New Device</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Device Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newDevice.name}
            onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            name="device_type"
            label="Device Type"
            type="text"
            fullWidth
            variant="outlined"
            value={newDevice.device_type}
            onChange={(e) => setNewDevice({...newDevice, device_type: e.target.value})}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="location"
            label="Location"
            type="text"
            fullWidth
            variant="outlined"
            value={newDevice.location}
            onChange={(e) => setNewDevice({...newDevice, location: e.target.value})}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="model"
            label="Model"
            type="text"
            fullWidth
            variant="outlined"
            value={newDevice.model}
            onChange={(e) => setNewDevice({...newDevice, model: e.target.value})}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="manufacturer"
            label="Manufacturer"
            type="text"
            fullWidth
            variant="outlined"
            value={newDevice.manufacturer}
            onChange={(e) => setNewDevice({...newDevice, manufacturer: e.target.value})}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="firmware_version"
            label="Firmware Version"
            type="text"
            fullWidth
            variant="outlined"
            value={newDevice.firmware_version}
            onChange={(e) => setNewDevice({...newDevice, firmware_version: e.target.value})}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleAddClose} variant="outlined" sx={{ borderRadius: 20 }}>Cancel</Button>
          <Button onClick={handleAddSubmit} variant="contained" color="primary" sx={{ borderRadius: 20 }}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete device "{deviceToDelete?.name}"? This action cannot be undone.
          </Typography>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleDeleteDialogClose} variant="outlined" sx={{ borderRadius: 20 }}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" sx={{ borderRadius: 20 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DevicesPage; 