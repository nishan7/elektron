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
import { extractDeviceId, getActiveDevices } from '../utils/deviceUtils';

// Components
import DeviceStatus from '../components/DeviceStatus';
import AlertsList from '../components/AlertsList';
import RecentAlerts from '../components/RecentAlerts';
import StatCard from '../components/StatCard';
import LivePowerChart from '../components/LivePowerChart';

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
  const [liveData, setLiveData] = useState({});
  const [realTimeTotalPower, setRealTimeTotalPower] = useState(0);

  // Fetch real-time power data
  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        // Get real-time data file (same as LivePowerChart)
        const response = await fetch('/live_data.json');
        
        if (!response.ok) {
          if (response.status === 404) {
            console.log('Live data file not found, it may not have been created yet');
            return;
          }
          throw new Error(`Failed to get real-time data: ${response.statusText}`);
        }
        
        const liveData = await response.json();
        console.log('Dashboard retrieved real-time data:', liveData);
        
        // Calculate total power from all devices' latest readings
        let totalPower = 0;
        
        Object.keys(liveData).forEach(deviceId => {
          const deviceReadings = liveData[deviceId];
          if (deviceReadings && deviceReadings.length > 0) {
            // Get the most recent reading
            const latestReading = deviceReadings[deviceReadings.length - 1];
            totalPower += latestReading.power;
          }
        });
        
        setLiveData(liveData);
        setRealTimeTotalPower(totalPower);
      } catch (error) {
        console.error('Error loading real-time power data:', error);
      }
    };
    
    // Initial load
    fetchLiveData();
    
    // Set timed refresh - update more frequently than the dashboard data
    const intervalId = setInterval(fetchLiveData, 5000); // Refresh every 5 seconds
    
    // Clean up when component unmounts
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch devices
        const devicesResponse = await axios.get(`${config.apiUrl}/api/device`);
        const devicesList = devicesResponse.data;
        setDevices(devicesList);
        console.log('Devices:', devicesList);
        const activeDevices = getActiveDevices(devicesList);
        
        // Fetch power readings for each device
        const endTime = new Date();
        const startTime = new Date(endTime - 24 * 60 * 60 * 1000);
        
        const powerReadingsPromises = activeDevices.map(device => {
          const deviceId = extractDeviceId(device);
          console.log(`Fetching power data for device ${deviceId} in dashboard`);
          
          return axios.get(`${config.apiUrl}/api/record/data`, {
            params: {
              device_id: deviceId,
              start_time: startTime.toISOString(),
              end_time: endTime.toISOString(),
            },
          });
        });
        
        try {
          const powerReadingsResponses = await Promise.all(powerReadingsPromises);
          const allPowerReadings = powerReadingsResponses.flatMap(response => response.data || []);
          console.log('All power readings:', allPowerReadings);
          
          setDashboardData({
            totalDevices: devicesList.length,
            activeDevices: activeDevices.length,
            totalPower: allPowerReadings.reduce((sum, reading) => sum + reading.power, 0),
            powerReadings: allPowerReadings,
          });
        } catch (err) {
          console.error('Error fetching power readings:', err);
          // Continue with what we have
          setDashboardData({
            totalDevices: devicesList.length,
            activeDevices: activeDevices.length,
            totalPower: 0,
            powerReadings: [],
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000); // Refresh every minute
    
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
        
        <Grid item xs={12} md={7}>
          <DeviceStatus />
        </Grid>
        
        <Grid item xs={12} md={5}>
          <RecentAlerts />
        </Grid>
        
        <Grid item xs={12}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <StatCard 
                title="Total Devices" 
                value={dashboardData.totalDevices} 
                icon="devices"
                color="#4caf50"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard 
                title="Active Devices" 
                value={dashboardData.activeDevices} 
                icon="power"
                color="#2196f3"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard 
                title="Total Power Consumption" 
                value={`${Math.round(realTimeTotalPower)} W`} 
                icon="bolt"
                color="#f44336"
              />
            </Grid>
          </Grid>
        </Grid>
        
        <Grid item xs={12}>
          <LivePowerChart />
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard; 