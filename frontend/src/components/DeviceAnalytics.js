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
import AlertsList from './AlertsList';

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
    { name: 'HVAC', value: 45 },
    { name: 'Lighting', value: 25 },
    { name: 'Appliances', value: 20 },
    { name: 'Other', value: 10 },
  ];
};

const generateDeviceAlerts = () => {
  return [
    {
      id: '1',
      type: 'warning',
      message: 'Temperature approaching threshold',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
      id: '2',
      type: 'critical',
      message: 'Power consumption spike detected',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: '3',
      type: 'info',
      message: 'Regular maintenance check completed',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
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

function DeviceAnalytics({ deviceId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [device, setDevice] = useState(sampleDevice);
  const [timeRange, setTimeRange] = useState('24h');
  const [deviceData, setDeviceData] = useState([]);
  const [loadDistribution, setLoadDistribution] = useState([]);
  const [deviceAlerts, setDeviceAlerts] = useState([]);

  useEffect(() => {
    setLoading(true);
    setDeviceData(generateDeviceData());
    setLoadDistribution(generateLoadDistribution());
    setDeviceAlerts(generateDeviceAlerts());
    setLoading(false);
  }, [timeRange]);

  const handleTimeRangeChange = (event, newValue) => {
    if (newValue !== null) {
      setTimeRange(newValue);
    }
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
          Device Analytics
        </Typography>
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={handleTimeRangeChange}
          size="small"
        >
          <ToggleButton value="24h">24 Hours</ToggleButton>
          <ToggleButton value="7d">7 Days</ToggleButton>
          <ToggleButton value="30d">30 Days</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
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
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="temperature"
                    stroke="#ff7300"
                    name="Temperature"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="load"
                    stroke="#8884d8"
                    name="Load"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
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
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Voltage & Current
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
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="voltage" fill="#82ca9d" name="Voltage" />
                  <Bar yAxisId="right" dataKey="current" fill="#8884d8" name="Current" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Recent Alerts
            </Typography>
            <AlertsList alerts={deviceAlerts} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default DeviceAnalytics; 