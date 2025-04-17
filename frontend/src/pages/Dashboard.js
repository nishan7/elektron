import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import axios from 'axios';
import config from '../config';

// Components
import DeviceStatus from '../components/DeviceStatus';
import PowerConsumptionChart from '../components/PowerConsumptionChart';
import AlertsList from '../components/AlertsList';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [devices, setDevices] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    totalDevices: 0,
    activeDevices: 0,
    totalPower: 0,
    recentAlerts: [],
    powerReadings: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch devices
        const devicesResponse = await axios.get(`${config.apiUrl}/api/devices`);
        setDevices(devicesResponse.data);
        const activeDevices = devicesResponse.data.filter(device => device.is_active);
        
        // Fetch power readings for each device
        const endTime = new Date();
        const startTime = new Date(endTime - 24 * 60 * 60 * 1000);
        
        const powerReadingsPromises = activeDevices.map(device =>
          axios.get(`${config.apiUrl}/api/devices/${device.id}/readings`, {
            params: {
              start_time: startTime.toISOString(),
              end_time: endTime.toISOString(),
            },
          })
        );
        
        const powerReadingsResponses = await Promise.all(powerReadingsPromises);
        const allPowerReadings = powerReadingsResponses.flatMap(response => response.data);
        
        // Fetch alerts for each device
        const alertsPromises = activeDevices.map(device =>
          axios.get(`${config.apiUrl}/api/alerts/${device.id}`, {
            params: { resolved: false, limit: 5 }
          })
        );
        
        const alertsResponses = await Promise.all(alertsPromises);
        const allAlerts = alertsResponses.flatMap(response => response.data);
        
        // Sort alerts by timestamp
        const sortedAlerts = allAlerts.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        setDashboardData({
          totalDevices: devicesResponse.data.length,
          activeDevices: activeDevices.length,
          totalPower: allPowerReadings.reduce((sum, reading) => sum + reading.power, 0),
          recentAlerts: sortedAlerts.slice(0, 5),
          powerReadings: allPowerReadings,
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const handleDeviceChange = (deviceId) => {
    console.log('Device changed in Dashboard:', deviceId);
    setSelectedDevice(deviceId);
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
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>
            Dashboard
          </Typography>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Device Status" />
            <CardContent>
              <DeviceStatus />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Recent Alerts" />
            <CardContent>
              <AlertsList />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Power Consumption" />
            <CardContent>
              <PowerConsumptionChart 
                useSampleData={config.useSampleData} 
                selectedDevice={selectedDevice}
                onDeviceChange={handleDeviceChange}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard; 