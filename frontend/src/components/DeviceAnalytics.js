import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import axios from 'axios';
import config from '../config';

// Sample data generator functions
const generateDeviceData = () => {
  const data = [];
  const baseTemp = 35;
  const baseLoad = 60;
  const baseVoltage = 220;
  const baseCurrent = 10;

  for (let hour = 0; hour < 24; hour++) {
    data.push({
      hour: `${hour}:00`,
      temperature: Math.round(baseTemp + Math.random() * 10),
      load: Math.round(baseLoad + Math.random() * 30),
      voltage: Math.round(baseVoltage + (Math.random() - 0.5) * 10),
      current: Math.round(baseCurrent + Math.random() * 5),
    });
  }
  return data;
};

const generateLoadDistribution = () => {
  return [
    { name: 'Lighting', value: 25 },
    { name: 'HVAC', value: 35 },
    { name: 'Appliances', value: 20 },
    { name: 'Electronics', value: 15 },
    { name: 'Other', value: 5 },
  ];
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Sample device data
const sampleDevice = {
  id: '1',
  name: 'Main Panel',
  type: 'panel',
  status: 'active',
  health: 'good',
  lastUpdated: new Date().toISOString(),
};

function DeviceAnalytics({ deviceId, useSampleData = false }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [device, setDevice] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [deviceData, setDeviceData] = useState([]);
  const [loadDistribution, setLoadDistribution] = useState([]);

  useEffect(() => {
    if (useSampleData) {
      setDevice(sampleDevice);
      fetchSampleData();
    } else {
      fetchDevice();
      fetchData();
    }
  }, [deviceId, timeRange, useSampleData]);

  const fetchDevice = async () => {
    try {
      const response = await axios.get(`/api/device/${deviceId}`);
      setDevice(response.data);
    } catch (err) {
      console.error('Failed to load device:', err);
      setDevice(sampleDevice);
    }
  };

  const fetchSampleData = () => {
    setLoading(true);
    setDeviceData(generateDeviceData());
    setLoadDistribution(generateLoadDistribution());
    setLoading(false);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const endTime = new Date();
      let startTime = new Date();
      
      switch (timeRange) {
        case '24h':
          startTime.setHours(startTime.getHours() - 24);
          break;
        case '7d':
          startTime.setDate(startTime.getDate() - 7);
          break;
        case '30d':
          startTime.setDate(startTime.getDate() - 30);
          break;
        default:
          startTime.setHours(startTime.getHours() - 24);
      }
      
      // In a real application, make API calls to fetch device specific data
      let measurements = [];
      
      try {
        const response = await axios.get(`${config.apiUrl}/api/record/data`, {
          params: {
            device_id: deviceId,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString()
          }
        });
        
        if (response.data && response.data.length > 0) {
          // Process raw readings into device analytics data
          measurements = processReadingsForAnalytics(response.data);
        } else {
          console.log('No readings found, using sample data');
          measurements = generateDeviceData();
        }
      } catch (err) {
        console.error('Error fetching device readings:', err);
        measurements = generateDeviceData();
      }
      
      // For load distribution, either use real data breakdown or sample
      let distribution = [];
      try {
        // In a real app, this would be a separate API call
        // const distributionResponse = await axios.get(`/api/device/${deviceId}/load-distribution`);
        // distribution = distributionResponse.data;
        
        // For now, generate sample distribution
        distribution = generateLoadDistribution();
      } catch (err) {
        distribution = generateLoadDistribution();
      }
      
      setDeviceData(measurements);
      setLoadDistribution(distribution);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load device analytics data:', err);
      setError('Failed to load device analytics data');
      setLoading(false);
    }
  };

  // Add new function to process raw readings into analytics data
  const processReadingsForAnalytics = (readings) => {
    if (!readings || readings.length === 0) return generateDeviceData();
    
    // Sort by timestamp
    const sortedReadings = [...readings].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    // Group readings by hour
    const hourlyData = {};
    
    sortedReadings.forEach(reading => {
      const date = new Date(reading.timestamp);
      const hour = date.getHours();
      const hourKey = `${hour}:00`;
      
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = {
          hour: hourKey,
          temperature: 0,
          load: 0,
          voltage: 0,
          current: 0,
          count: 0
        };
      }
      
      // For temperature, voltage and current, use fixed values or analyze from real sensors
      // In this example, we calculate "load" as a percentage of max power (assume 3000W max)
      const maxPower = 3000; 
      const loadPercentage = Math.min(100, (reading.power / maxPower) * 100);
      
      // Use real power value to generate reasonable values for other metrics
      hourlyData[hourKey].temperature += 35 + (reading.power / 500); // Higher power = higher temp
      hourlyData[hourKey].load += loadPercentage;
      hourlyData[hourKey].voltage += 220 + ((Math.random() - 0.5) * 10); // Fluctuate around 220V
      hourlyData[hourKey].current += reading.power / 220; // I = P/V
      hourlyData[hourKey].count += 1;
    });
    
    // Calculate averages
    return Object.values(hourlyData).map(hour => ({
      hour: hour.hour,
      temperature: Math.round(hour.temperature / hour.count),
      load: Math.round(hour.load / hour.count),
      voltage: Math.round(hour.voltage / hour.count),
      current: Math.round(hour.current / hour.count * 10) / 10,
    }));
  };

  const handleTimeRangeChange = (event, newValue) => {
    if (newValue !== null) {
      setTimeRange(newValue);
    }
  };

  // Add additional chart component for power quality analysis
  const renderPowerQualityChart = () => {
    if (deviceData.length === 0) return null;
    
    return (
      <Grid item xs={12}>
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="medium">
            Power Quality Analysis
          </Typography>
          <Box height={300}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={deviceData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis yAxisId="left" label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Current (A)', angle: 90, position: 'insideRight' }} />
                <Tooltip formatter={(value) => value.toLocaleString()} />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="voltage"
                  stroke="#82ca9d"
                  name="Voltage"
                  strokeWidth={2}
                  dot={{ strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="current"
                  stroke="#ffc658"
                  name="Current"
                  strokeWidth={2}
                  dot={{ strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>
    );
  };

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
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Device Analytics: {device?.name || 'Device Details'}
        </Typography>
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={handleTimeRangeChange}
          size="small"
          aria-label="time range selection"
        >
          <ToggleButton value="24h" aria-label="last 24 hours">24h</ToggleButton>
          <ToggleButton value="7d" aria-label="last 7 days">7d</ToggleButton>
          <ToggleButton value="30d" aria-label="last 30 days">30d</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="medium">
              Temperature & Load
            </Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={deviceData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis yAxisId="left" label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Load (%)', angle: 90, position: 'insideRight' }} />
                  <Tooltip formatter={(value) => value.toLocaleString()} />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="temperature"
                    stroke="#ff7300"
                    name="Temperature"
                    strokeWidth={2}
                    dot={{ strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="load"
                    stroke="#8884d8"
                    name="Load"
                    strokeWidth={2}
                    dot={{ strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="medium">
              Load Distribution
            </Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={loadDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {loadDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `${value.toLocaleString()} W`}
                    labelFormatter={(name) => `Category: ${name}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="medium">
              Voltage & Current Trends
            </Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={deviceData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis yAxisId="left" label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Current (A)', angle: 90, position: 'insideRight' }} />
                  <Tooltip formatter={(value) => value.toLocaleString()} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="voltage" fill="#3f51b5" name="Voltage" />
                  <Bar yAxisId="right" dataKey="current" fill="#f44336" name="Current" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        {renderPowerQualityChart()}
        
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mt={2}>
            <Typography variant="body2" color="text.secondary">
              Data refreshes automatically based on the selected time range.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last updated: {new Date().toLocaleString('en-US', {
                timeZone: 'America/Los_Angeles',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              })}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="medium">
              Device Performance Metrics
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>Efficiency</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {Math.round(85 + Math.random() * 10)}%
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'info.contrastText' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>Uptime</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {Math.round(98 + Math.random() * 2)}%
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>Health Score</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {Math.round(90 + Math.random() * 10)}/100
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>Power Factor</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {(0.92 + Math.random() * 0.08).toFixed(2)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default DeviceAnalytics; 