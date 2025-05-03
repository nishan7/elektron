import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
} from 'recharts';

// Sample data generator functions
const generateHourlyData = (deviceId = 'all') => {
  const data = [];
  const baseLoad = deviceId === 'all' ? 2000 : 1000; // Base load in watts
  const peakHours = [8, 9, 10, 17, 18, 19]; // Peak usage hours

  for (let hour = 0; hour < 24; hour++) {
    let load = baseLoad;
    
    // Add peak load during peak hours
    if (peakHours.includes(hour)) {
      load += Math.random() * (deviceId === 'all' ? 3000 : 1500) + (deviceId === 'all' ? 1000 : 500);
    } else {
      load += Math.random() * (deviceId === 'all' ? 1000 : 500);
    }

    // Add some randomness
    load += (Math.random() - 0.5) * (deviceId === 'all' ? 500 : 250);

    data.push({
      hour: `${hour}:00`,
      consumption: Math.round(load),
      cost: Math.round((load / 1000) * 0.15), // $0.15 per kWh
    });
  }
  return data;
};

const generateDailyData = (deviceId = 'all') => {
  const data = [];
  const baseLoad = deviceId === 'all' ? 1500 : 750;
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  weekdays.forEach((day, index) => {
    let load = baseLoad;
    
    // Higher consumption on weekdays
    if (index < 5) {
      load += Math.random() * (deviceId === 'all' ? 2000 : 1000) + (deviceId === 'all' ? 1000 : 500);
    } else {
      load += Math.random() * (deviceId === 'all' ? 1000 : 500);
    }

    data.push({
      day,
      consumption: Math.round(load * 24), // Daily consumption
      cost: Math.round((load * 24 / 1000) * 0.15), // Daily cost
    });
  });
  return data;
};

const generateMonthlyData = (deviceId = 'all') => {
  const data = [];
  const baseLoad = deviceId === 'all' ? 2000 : 1000;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  months.forEach((month, index) => {
    let load = baseLoad;
    
    // Higher consumption in summer and winter months
    if (index >= 5 && index <= 8) { // Summer months
      load += Math.random() * (deviceId === 'all' ? 3000 : 1500) + (deviceId === 'all' ? 2000 : 1000);
    } else if (index >= 11 || index <= 1) { // Winter months
      load += Math.random() * (deviceId === 'all' ? 2500 : 1250) + (deviceId === 'all' ? 1500 : 750);
    } else {
      load += Math.random() * (deviceId === 'all' ? 1500 : 750);
    }

    data.push({
      month,
      consumption: Math.round(load * 24 * 30), // Monthly consumption
      cost: Math.round((load * 24 * 30 / 1000) * 0.15), // Monthly cost
    });
  });
  return data;
};

// Sample devices data
const sampleDevices = [
  { id: '1', name: 'Main Panel', type: 'panel', status: 'active' },
  { id: '2', name: 'HVAC System', type: 'hvac', status: 'active' },
  { id: '3', name: 'Lighting Circuit', type: 'lighting', status: 'active' },
  { id: '4', name: 'Kitchen Appliances', type: 'appliance', status: 'active' },
  { id: '5', name: 'Office Equipment', type: 'equipment', status: 'active' },
];

function PowerConsumptionChart({ selectedDevice = 'all', onDeviceChange, deviceId }) {
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('hourly');
  const [data, setData] = useState([]);
  const [currentDevice, setCurrentDevice] = useState(deviceId || selectedDevice);

  const fetchData = useCallback(() => {
    setLoading(true);
    let sampleData;
    switch (timeRange) {
      case 'hourly':
        sampleData = generateHourlyData(currentDevice);
        break;
      case 'daily':
        sampleData = generateDailyData(currentDevice);
        break;
      case 'monthly':
        sampleData = generateMonthlyData(currentDevice);
        break;
      default:
        sampleData = generateHourlyData(currentDevice);
    }
    setData(sampleData);
    setLoading(false);
  }, [timeRange, currentDevice]);

  // Update currentDevice when deviceId or selectedDevice prop changes
  useEffect(() => {
    setCurrentDevice(deviceId || selectedDevice);
    fetchData();
  }, [deviceId, selectedDevice, fetchData]);

  // Fetch data when timeRange or currentDevice changes
  useEffect(() => {
    fetchData();
  }, [timeRange, currentDevice, fetchData]);

  const handleTimeRangeChange = (event, newValue) => {
    if (newValue !== null) {
      setTimeRange(newValue);
    }
  };

  const handleDeviceChange = (event) => {
    const newDevice = event.target.value;
    setCurrentDevice(newDevice);
    if (onDeviceChange) {
      onDeviceChange(newDevice);
    }
  };

  const getXAxisDataKey = () => {
    switch (timeRange) {
      case 'hourly':
        return 'hour';
      case 'daily':
        return 'day';
      case 'monthly':
        return 'month';
      default:
        return 'hour';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Device</InputLabel>
            <Select
              value={currentDevice}
              onChange={handleDeviceChange}
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
        </Grid>
        <Grid item xs={12} md={6}>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={handleTimeRangeChange}
            fullWidth
          >
            <ToggleButton value="hourly">Hourly</ToggleButton>
            <ToggleButton value="daily">Daily</ToggleButton>
            <ToggleButton value="monthly">Monthly</ToggleButton>
          </ToggleButtonGroup>
        </Grid>
      </Grid>

      <Box height={400}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={getXAxisDataKey()} />
            <YAxis yAxisId="left" label={{ value: 'Power (W)', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Cost ($)', angle: 90, position: 'insideRight' }} />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="consumption"
              stroke="#8884d8"
              name="Power Consumption"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cost"
              stroke="#82ca9d"
              name="Cost"
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>

      <Box mt={3}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="subtitle2" color="textSecondary">
                Total Consumption
              </Typography>
              <Typography variant="h6">
                {data.reduce((sum, item) => sum + item.consumption, 0).toLocaleString()} W
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="subtitle2" color="textSecondary">
                Peak Consumption
              </Typography>
              <Typography variant="h6">
                {Math.max(...data.map(item => item.consumption)).toLocaleString()} W
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="subtitle2" color="textSecondary">
                Total Cost
              </Typography>
              <Typography variant="h6">
                ${data.reduce((sum, item) => sum + item.cost, 0).toLocaleString()}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}

export default PowerConsumptionChart; 