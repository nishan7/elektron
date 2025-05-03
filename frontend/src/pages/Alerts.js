import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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

// Components
import AlertsList from '../components/AlertsList';

// Sample data
const sampleDevices = [
  { id: '1', name: 'Main Panel', type: 'panel', status: 'active' },
  { id: '2', name: 'HVAC System', type: 'hvac', status: 'active' },
  { id: '3', name: 'Lighting Circuit', type: 'lighting', status: 'active' },
  { id: '4', name: 'Kitchen Appliances', type: 'appliance', status: 'active' },
  { id: '5', name: 'Office Equipment', type: 'equipment', status: 'active' },
];

const sampleAlerts = [
  {
    id: '1',
    deviceId: '2',
    deviceName: 'HVAC System',
    type: 'warning',
    message: 'High temperature detected in server room',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    resolved: false,
  },
  {
    id: '2',
    deviceId: '5',
    deviceName: 'Office Equipment',
    type: 'critical',
    message: 'Power consumption exceeded threshold',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
    resolved: false,
  },
  {
    id: '3',
    deviceId: '1',
    deviceName: 'Main Panel',
    type: 'info',
    message: 'System check completed successfully',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    resolved: true,
  },
  {
    id: '4',
    deviceId: '3',
    deviceName: 'Lighting Circuit',
    type: 'warning',
    message: 'Unusual power consumption pattern detected',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
    resolved: false,
  },
  {
    id: '5',
    deviceId: '4',
    deviceName: 'Kitchen Appliances',
    type: 'info',
    message: 'Regular maintenance check completed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    resolved: true,
  },
];

function AlertsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    severity: 'all',
    device: 'all',
    resolved: false,
  });

  const filteredAlerts = sampleAlerts.filter(alert => {
    const matchesSeverity = filters.severity === 'all' || alert.type === filters.severity;
    const matchesDevice = filters.device === 'all' || alert.deviceId === filters.device;
    const matchesResolved = alert.resolved === filters.resolved;
    return matchesSeverity && matchesDevice && matchesResolved;
  });

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
  };

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

          <AlertsList alerts={filteredAlerts} />
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
              {sampleDevices.map((device) => (
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