import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import axios from 'axios';
import config from '../config';

// Components
import RecentAlerts from '../components/RecentAlerts';

function AlertsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    severity: 'all',
    device: 'all',
    resolved: false,
  });

  useEffect(() => {
    fetchAlerts();
    fetchDevices();
  }, [filters]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      // First get all devices
      const devicesResponse = await axios.get(`${config.apiUrl}/api/devices`);
      const devices = devicesResponse.data;

      // Then fetch alerts for each device
      const alertPromises = devices.map(device =>
        axios.get(`${config.apiUrl}/api/alerts/${device.id}`, {
          params: {
            resolved: filters.resolved,
            severity: filters.severity,
            limit: 100
          }
        })
      );

      const alertResponses = await Promise.all(alertPromises);
      const allAlerts = alertResponses.flatMap(response => response.data);
      
      // Sort alerts by timestamp
      const sortedAlerts = allAlerts.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );

      setAlerts(sortedAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setError('Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const fetchDevices = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/devices`);
      setDevices(response.data);
    } catch (err) {
      console.error('Failed to load devices:', err);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setFilters({
      ...filters,
      resolved: newValue === 1,
    });
  };

  const handleFilterClick = () => {
    setFilterDialogOpen(true);
  };

  const handleFilterClose = () => {
    setFilterDialogOpen(false);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const handleFilterSubmit = () => {
    setFilterDialogOpen(false);
    fetchAlerts();
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await axios.put(`${config.apiUrl}/api/alerts/${alertId}/resolve`);
      fetchAlerts();
    } catch (err) {
      setError('Failed to resolve alert');
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return <CheckCircleIcon color="info" />;
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
      <Typography variant="h4" gutterBottom>
        Alerts
      </Typography>

      <Paper sx={{ mt: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Active Alerts" />
          <Tab label="Resolved Alerts" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button
              variant="outlined"
              onClick={handleFilterClick}
            >
              Filter Alerts
            </Button>
          </Box>

          <RecentAlerts />
        </Box>
      </Paper>

      <Dialog open={filterDialogOpen} onClose={handleFilterClose}>
        <DialogTitle>Filter Alerts</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Severity</InputLabel>
            <Select
              name="severity"
              value={filters.severity}
              onChange={handleFilterChange}
              label="Severity"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="warning">Warning</MenuItem>
              <MenuItem value="info">Info</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Device</InputLabel>
            <Select
              name="device"
              value={filters.device}
              onChange={handleFilterChange}
              label="Device"
            >
              <MenuItem value="all">All Devices</MenuItem>
              {devices.map((device) => (
                <MenuItem key={device.id} value={device.id}>
                  {device.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFilterClose}>Cancel</Button>
          <Button onClick={handleFilterSubmit} variant="contained">
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AlertsPage; 