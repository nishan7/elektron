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
import LoadDistribution from '../components/LoadDistribution';

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
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <PowerConsumptionChart />
        </Grid>
        <Grid item xs={12} md={6}>
          <DeviceAnalytics />
        </Grid>
        <Grid item xs={12} md={6}>
          <LoadDistribution />
        </Grid>
      </Grid>
    </Box>
  );
}

export default Analytics; 