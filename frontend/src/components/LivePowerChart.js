import React, { useState, useEffect, useCallback } from 'react';
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
  Button,
  IconButton,
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
import RefreshIcon from '@mui/icons-material/Refresh';

// Real-time Power Chart Component
function LivePowerChart() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({});
  const [selectedDevice, setSelectedDevice] = useState('');
  const [deviceOptions, setDeviceOptions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Load real-time data function as a useCallback to prevent unnecessary recreations
  const loadLiveData = useCallback(async () => {
    try {
      // Add cache busting parameter to prevent browser caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/live_data.json?nocache=${timestamp}`);
      
      if (!response.ok) {
        if (response.status === 404) {
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
      
      // Update the last update timestamp
      setLastUpdate(new Date());
      
      // Set data with a new object reference to trigger re-renders
      setData({...liveData});
      setLoading(false);
    } catch (error) {
      console.error('Error loading real-time data:', error);
      setError('Failed to load real-time data. Please ensure the real-time data collection script is running');
      setLoading(false);
    }
  }, [selectedDevice]);
  
  // Manual refresh handler
  const handleRefresh = () => {
    loadLiveData();
  };
  
  // Load real-time data
  useEffect(() => {
    // Initial load
    loadLiveData();
    
    // Set timed refresh - update more frequently
    const intervalId = setInterval(loadLiveData, 30000); // Refresh every 3 seconds for more real-time feel
    
    // Clean up when component unmounts
    return () => clearInterval(intervalId);
  }, [loadLiveData]);
  
  // When selected device or data changes, update chart data
  useEffect(() => {
    if (selectedDevice && data[selectedDevice]) {
      // Prepare chart data
      const chartData = data[selectedDevice].map(item => ({
        timestamp: item.timestamp,
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
        <Box display="flex" alignItems="center">
          <Typography variant="h6" mr={1}>Real-time Power Monitoring</Typography>
          <IconButton color="primary" onClick={handleRefresh} size="small">
            <RefreshIcon />
          </IconButton>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Typography>
        </Box>
        
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
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(timestamp) => {
                    try {
                      return new Date(timestamp).toLocaleTimeString('en-US', { 
                        timeZone: 'America/Los_Angeles',
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit',
                        hour12: false 
                      });
                    } catch (e) { return ''; }
                  }}
                  angle={-45} 
                  textAnchor="end" 
                  height={60} 
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={[0, Math.max(30, peak * 1.2)]} 
                  label={{ value: 'Power (W)', angle: -90, position: 'insideLeft' }} 
                />
                <Tooltip 
                  labelFormatter={(label) => {
                    try {
                      return new Date(label).toLocaleString('en-US', { 
                        timeZone: 'America/Los_Angeles',
                        year: 'numeric', 
                        month: 'numeric', 
                        day: 'numeric', 
                        hour: 'numeric', 
                        minute: 'numeric', 
                        second: 'numeric',
                        hour12: false
                      });
                    } catch (e) { return label; }
                  }}
                  formatter={(value) => [`${value.toFixed(1)} W`, 'Power']}
                />
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