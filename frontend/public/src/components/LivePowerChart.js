import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
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

// Real-time Power Chart Component
function LivePowerChart() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({});
  const [selectedDevice, setSelectedDevice] = useState('');
  const [deviceOptions, setDeviceOptions] = useState([]);
  const [chartData, setChartData] = useState([]);
  
  // Load real-time data
  useEffect(() => {
    const loadLiveData = async () => {
      try {
        // Get real-time data file
        const response = await fetch('/live_data.json');
        
        if (!response.ok) {
          if (response.status === 404) {
            // File may not yet be created
            console.log('Live data file not found, it may not have been created yet');
            setLoading(false);
            return;
          }
          throw new Error(`Failed to get real-time data: ${response.statusText}`);
        }
        
        const liveData = await response.json();
        console.log('Retrieved real-time data:', liveData);
        
        // Update device options list
        const devices = Object.keys(liveData);
        setDeviceOptions(devices);
        
        // If no device is selected but device data exists, select the first one
        if (!selectedDevice && devices.length > 0) {
          setSelectedDevice(devices[0]);
        }
        
        setData(liveData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading real-time data:', error);
        setError('Failed to load real-time data. Please ensure the real-time data collection script is running');
        setLoading(false);
      }
    };
    
    // Initial load
    loadLiveData();
    
    // Set timed refresh
    const intervalId = setInterval(loadLiveData, 5000); // Refresh every 5 seconds
    
    // Clean up when component unmounts
    return () => clearInterval(intervalId);
  }, [selectedDevice]);
  
  // When selected device or data changes, update chart data
  useEffect(() => {
    if (selectedDevice && data[selectedDevice]) {
      // Prepare chart data
      const chartData = data[selectedDevice].map(item => ({
        time: item.local_time,
        power: item.power
      }));
      
      setChartData(chartData);
    } else {
      setChartData([]);
    }
  }, [selectedDevice, data]);
  
  // Handle device selection change
  const handleDeviceChange = (event) => {
    setSelectedDevice(event.target.value);
  };
  
  // Calculate current power and peak power
  const calculateStats = () => {
    if (!chartData || chartData.length === 0) {
      return { current: 0, peak: 0 };
    }
    
    const current = chartData[chartData.length - 1].power;
    const peak = Math.max(...chartData.map(item => item.power));
    
    return { current, peak };
  };
  
  const { current, peak } = calculateStats();
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
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
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Real-time Power Monitoring</Typography>
        
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Device</InputLabel>
          <Select
            value={selectedDevice}
            label="Device"
            onChange={handleDeviceChange}
            displayEmpty
          >
            {deviceOptions.length === 0 ? (
              <MenuItem disabled value="">
                No devices available
              </MenuItem>
            ) : (
              deviceOptions.map((deviceId) => (
                <MenuItem key={deviceId} value={deviceId}>
                  Device {deviceId.substring(deviceId.length - 6)}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
      </Box>
      
      {chartData.length > 0 ? (
        <>
          <Box height={400}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis 
                  domain={[0, Math.max(30, peak * 1.2)]} 
                  label={{ value: 'Power (W)', angle: -90, position: 'insideLeft' }} 
                />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="power"
                  stroke="#8884d8"
                  name="Power (W)"
                  dot={false}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
          
          <Box mt={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, textAlign: 'center', borderLeft: '5px solid #8884d8' }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Current Power
                  </Typography>
                  <Typography variant="h4" component="div">
                    {current.toFixed(2)} W
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, textAlign: 'center', borderLeft: '5px solid #82ca9d' }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Peak Power
                  </Typography>
                  <Typography variant="h4" component="div">
                    {peak.toFixed(2)} W
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </>
      ) : (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <Typography variant="body1" color="textSecondary">
            {deviceOptions.length === 0
              ? 'No real-time data available. Please ensure the data collection script is running.'
              : 'Select a device to view real-time power data.'}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

export default LivePowerChart; 