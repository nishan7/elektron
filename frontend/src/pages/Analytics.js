import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import axios from 'axios';
import config from '../config';

// Components
import PowerConsumptionChart from '../components/PowerConsumptionChart';
import DeviceAnalytics from '../components/DeviceAnalytics';
import LoadDistribution from '../components/LoadDistribution';

// Sample devices data
const sampleDevices = [
  { _id: 'all', name: 'All Devices' },
  { _id: '1', name: 'Main Panel', type: 'panel', status: 'active' },
  { _id: '2', name: 'HVAC System', type: 'hvac', status: 'active' },
  { _id: '3', name: 'Lighting Circuit', type: 'lighting', status: 'active' },
  { _id: '4', name: 'Kitchen Appliances', type: 'appliance', status: 'active' },
  { _id: '5', name: 'Office Equipment', type: 'equipment', status: 'active' },
];

function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${config.apiUrl}/api/device`);
      const fetchedDevices = response.data;
      if (!fetchedDevices.find(d => d._id === 'all')) {
        setDevices([{ _id: 'all', name: 'All Devices' }, ...fetchedDevices]);
      } else {
        setDevices(fetchedDevices);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to load devices:', err);
      setError('Failed to load device list. Displaying sample data or limited functionality.');
      setDevices(sampleDevices);
      setLoading(false);
    }
  };

  const handleDeviceChange = (event) => {
    setSelectedDevice(event.target.value);
  };

  const handleTimeRangeChange = (event, newTimeRange) => {
    if (newTimeRange !== null) {
      setSelectedTimeRange(newTimeRange);
    }
  };

  // Find the name of the selected device
  const selectedDeviceObject = devices.find(d => d._id === selectedDevice);
  const selectedDeviceName = selectedDeviceObject ? selectedDeviceObject.name : (selectedDevice === 'all' ? 'All Devices' : selectedDevice); // Fallback logic

  if (loading && devices.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error && devices.length === sampleDevices.length && devices[0]?._id === 'all' && devices[1]?._id === '1') {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="device-select-label">Device</InputLabel>
            <Select
              labelId="device-select-label"
              id="device-select"
              value={selectedDevice}
              label="Device"
              onChange={handleDeviceChange}
            >
              {devices.map((device) => (
                <MenuItem key={device._id} value={device._id}>
                  {device.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={8} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end'} }}>
          <ToggleButtonGroup
            value={selectedTimeRange}
            exclusive
            onChange={handleTimeRangeChange}
            aria-label="time range"
          >
            <ToggleButton value="24h" aria-label="24 hours">
              24h
            </ToggleButton>
            <ToggleButton value="7d" aria-label="7 days">
              7d
            </ToggleButton>
            <ToggleButton value="30d" aria-label="30 days">
              30d
            </ToggleButton>
          </ToggleButtonGroup>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* PowerConsumptionChart is still conditional based on 'All Devices' */}
        {selectedDevice === 'all' && (
          <Grid item xs={12}> {/* Takes full width when visible */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Power Consumption Overview
                </Typography>
                <PowerConsumptionChart selectedDevice={selectedDevice} selectedTimeRange={selectedTimeRange} />
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* DeviceAnalytics and LoadDistribution will now always take full width */}
        <Grid item xs={12} md={12}> {/* Always full width */}
          <DeviceAnalytics selectedDevice={selectedDevice} selectedDeviceName={selectedDeviceName} selectedTimeRange={selectedTimeRange} />
        </Grid>
        <Grid item xs={12} md={12}> {/* Always full width */}
          <LoadDistribution selectedDevice={selectedDevice} selectedDeviceName={selectedDeviceName} selectedTimeRange={selectedTimeRange} />
        </Grid>
      </Grid>
    </Box>
  );
}

export default Analytics; 