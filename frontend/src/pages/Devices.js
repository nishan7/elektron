import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import API from '../API'; // Assuming API.js is setup for axios calls

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog states
  const [openAddEditDialog, setOpenAddEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  
  // Form state for Add/Edit
  const [currentDevice, setCurrentDevice] = useState({
    name: '',
    type: '',
    location: '',
    model: '',
    manufacturer: '',
    firmware_version: '',
    is_active: true,
    status: 'active', // Default status
    health: 'good',  // Default health
    max: null,
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [deviceIdToEdit, setDeviceIdToEdit] = useState(null);
  const [deviceIdToDelete, setDeviceIdToDelete] = useState(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.get('/api/device');
      setDevices(response.data || []);
    } catch (err) {
      console.error("Failed to fetch devices:", err);
      setError(err.response?.data?.detail || 'Could not fetch devices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- Dialog Handlers ---
  const handleOpenAddDialog = () => {
    setIsEditMode(false);
    setCurrentDevice({ // Reset form for Add
      name: '', type: '', location: '', model: '', manufacturer: '',
      firmware_version: '', is_active: true, status: 'active', health: 'good', max: null
    });
    setOpenAddEditDialog(true);
  };

  const handleOpenEditDialog = (device) => {
    console.log("Editing device. Full object:", device, "Attempting to use ID:", device._id);
    setIsEditMode(true);
    setDeviceIdToEdit(device._id);
    setCurrentDevice({ ...device, max: device.max === undefined ? null : device.max });
    setOpenAddEditDialog(true);
  };
  
  const handleOpenDeleteDialog = (id) => {
    console.log("Attempting to delete device with ID:", id);
    setDeviceIdToDelete(id);
    setOpenDeleteDialog(true);
  };

  const handleCloseDialogs = () => {
    setOpenAddEditDialog(false);
    setOpenDeleteDialog(false);
    setDeviceIdToEdit(null);
    setDeviceIdToDelete(null);
  };

  // --- Form Input Handler ---
  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setCurrentDevice(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'max' ? (value === '' ? null : parseFloat(value)) : value)
    }));
  };

  // --- CRUD Operations ---
  const handleSaveDevice = async () => {
    // Basic validation
    if (!currentDevice.name.trim()) {
      alert("Device name is required."); // Replace with a better notification
      return;
    }

    try {
      if (isEditMode && deviceIdToEdit) {
        // Create a shallow copy and remove id/_id before sending
        const { id, _id, created_at, updated_at, ...updatePayload } = currentDevice; 
        // Also remove created_at and updated_at as these should be managed by backend
        await API.put(`/api/device/${deviceIdToEdit}`, updatePayload); // Send payload without id/_id
      } else {
        // For creation, backend handles ID. If currentDevice contains id/_id from a previous edit session, remove it.
        const { id, _id, created_at, updated_at, ...createPayload } = currentDevice;
        await API.post('/api/device', createPayload);
      }
      fetchDevices(); // Refresh list
      handleCloseDialogs();
    } catch (err) {
      console.error("Failed to save device:", err);
      alert(err.response?.data?.detail || 'Failed to save device.'); // Replace
    }
  };

  const handleDeleteDevice = async () => {
    if (!deviceIdToDelete) return;
    try {
      await API.delete(`/api/device/${deviceIdToDelete}`);
      fetchDevices(); // Refresh list
      handleCloseDialogs();
    } catch (err) {
      console.error("Failed to delete device:", err);
      alert(err.response?.data?.detail || 'Failed to delete device.'); // Replace
    }
  };


  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"><CircularProgress /></Box>;
  }

  // Basic error display, can be enhanced
  // if (error) {
  //   return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  // }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Manage Devices</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddDialog} sx={{ mb: 2 }}>
        Add New Device
      </Button>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="devices table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {devices.length === 0 && !loading ? (
                <TableRow>
                    <TableCell colSpan={6} align="center">
                        No devices found.
                    </TableCell>
                </TableRow>
            ) : (
                devices.map((device) => (
                <TableRow key={device._id}>
                    <TableCell component="th" scope="row">{device.name}</TableCell>
                    <TableCell>{device.type || '-'}</TableCell>
                    <TableCell>{device.location || '-'}</TableCell>
                    <TableCell>{device.status || '-'}</TableCell>
                    <TableCell>{device.is_active ? 'Yes' : 'No'}</TableCell>
                    <TableCell align="right">
                    <IconButton onClick={() => handleOpenEditDialog(device)} size="small"><EditIcon /></IconButton>
                    <IconButton onClick={() => handleOpenDeleteDialog(device._id)} size="small"><DeleteIcon /></IconButton>
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Device Dialog */}
      <Dialog open={openAddEditDialog} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditMode ? 'Edit Device' : 'Add New Device'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" name="name" label="Device Name" type="text" fullWidth variant="outlined" value={currentDevice.name} onChange={handleInputChange} required sx={{mb:2}}/>
          <TextField margin="dense" name="type" label="Type (e.g., HVAC, Lighting)" type="text" fullWidth variant="outlined" value={currentDevice.type} onChange={handleInputChange} sx={{mb:2}}/>
          <TextField margin="dense" name="location" label="Location" type="text" fullWidth variant="outlined" value={currentDevice.location} onChange={handleInputChange} sx={{mb:2}}/>
          <TextField margin="dense" name="model" label="Model" type="text" fullWidth variant="outlined" value={currentDevice.model} onChange={handleInputChange} sx={{mb:2}}/>
          <TextField margin="dense" name="manufacturer" label="Manufacturer" type="text" fullWidth variant="outlined" value={currentDevice.manufacturer} onChange={handleInputChange} sx={{mb:2}}/>
          <TextField margin="dense" name="firmware_version" label="Firmware Version" type="text" fullWidth variant="outlined" value={currentDevice.firmware_version} onChange={handleInputChange} sx={{mb:2}}/>
          
          <FormControl fullWidth margin="dense" sx={{mb:2}}>
            <InputLabel id="status-select-label">Status</InputLabel>
            <Select labelId="status-select-label" name="status" value={currentDevice.status} label="Status" onChange={handleInputChange}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="error">Error</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="dense" sx={{mb:2}}>
            <InputLabel id="health-select-label">Health</InputLabel>
            <Select labelId="health-select-label" name="health" value={currentDevice.health} label="Health" onChange={handleInputChange}>
                <MenuItem value="good">Good</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
            </Select>
          </FormControl>
          
          <TextField margin="dense" name="max" label="Max Value (Optional, e.g. Power)" type="number" fullWidth variant="outlined" value={currentDevice.max === null ? '' : currentDevice.max} onChange={handleInputChange} sx={{mb:2}}/>
          
          <FormControlLabel control={<Checkbox checked={currentDevice.is_active} onChange={handleInputChange} name="is_active" />} label="Device is Active" sx={{mt:1}}/>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button onClick={handleSaveDevice} variant="contained">{isEditMode ? 'Save Changes' : 'Add Device'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDialogs}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this device? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button onClick={handleDeleteDevice} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default Devices; 