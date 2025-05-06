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
} from '@mui/material';
import axios from 'axios';
import config from '../config';

// Components
import PowerConsumptionChart from '../components/PowerConsumptionChart';
import DeviceAnalytics from '../components/DeviceAnalytics';
import HistoricalTrendsChart from '../components/HistoricalTrendsChart';
import UsageComparisonChart from '../components/UsageComparisonChart';
import LivePowerChart from '../components/LivePowerChart';

// Sample devices data
const sampleDevices = [
  { id: '1', name: 'Main Panel', type: 'panel', status: 'active' },
  { id: '2', name: 'HVAC System', type: 'hvac', status: 'active' },
  { id: '3', name: 'Lighting Circuit', type: 'lighting', status: 'active' },
  { id: '4', name: 'Kitchen Appliances', type: 'appliance', status: 'active' },
  { id: '5', name: 'Office Equipment', type: 'equipment', status: 'active' },
];

function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [tabValue, setTabValue] = useState(0);
  const [useSampleData, setUseSampleData] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${config.apiUrl}/api/device`);
      setDevices(response.data);
      setUseSampleData(false);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load devices:', err);
      // Use sample data when API fails
      setDevices(sampleDevices);
      setUseSampleData(true);
      setLoading(false);
    }
  };

  const handleDeviceChange = (event) => {
    setSelectedDevice(event.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
        Analytics
      </Typography>

      <Paper sx={{ mt: 3, p: 3, mb: 3 }}>
        <Typography variant="body1" paragraph>
          Monitor and analyze your electricity usage patterns over time. Select a device to view its specific consumption metrics or view aggregated data across all devices.
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Select Device</InputLabel>
              <Select
                value={selectedDevice}
                onChange={handleDeviceChange}
                label="Select Device"
              >
                <MenuItem value="all">All Devices</MenuItem>
                {devices.map((device) => (
                  <MenuItem key={device._id} value={device._id}>
                    {device.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
              <Tab label="Real-time" />
              <Tab label="Power Consumption" />
              <Tab label="Historical Trends" />
              <Tab label="Usage Comparison" />
              <Tab label="Device Details" />
            </Tabs>
          </Grid>

          <Grid item xs={12}>
            {tabValue === 0 && (
              <LivePowerChart
                selectedDevice={selectedDevice}
                useSampleData={useSampleData}
              />
            )}
            {tabValue === 1 && (
              <PowerConsumptionChart
                deviceId={selectedDevice}
                useSampleData={useSampleData}
              />
            )}
            {tabValue === 2 && (
              <HistoricalTrendsChart
                deviceId={selectedDevice}
                useSampleData={useSampleData}
              />
            )}
            {tabValue === 3 && (
              <UsageComparisonChart
                deviceId={selectedDevice}
                useSampleData={useSampleData}
              />
            )}
            {tabValue === 4 && (
              <DeviceAnalytics
                deviceId={selectedDevice}
                useSampleData={useSampleData}
              />
            )}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default Analytics; 