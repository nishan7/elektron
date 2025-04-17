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
import axios from 'axios';
import config from '../config';

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

function PowerConsumptionChart({ useSampleData = false, selectedDevice = 'all', onDeviceChange, deviceId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('hourly');
  const [data, setData] = useState([]);
  const [devices, setDevices] = useState([]);
  const [currentDevice, setCurrentDevice] = useState(deviceId || selectedDevice);

  const fetchSampleData = useCallback(() => {
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

  const fetchData = useCallback(async () => {
    if (useSampleData) {
      fetchSampleData();
      return;
    }

    try {
      setLoading(true);
      const endTime = new Date();
      const startTime = new Date();
      
      // Set the time range based on the selected option
      switch (timeRange) {
        case 'hourly':
          startTime.setHours(startTime.getHours() - 24);
          break;
        case 'daily':
          startTime.setDate(startTime.getDate() - 7);
          break;
        case 'monthly':
          startTime.setMonth(startTime.getMonth() - 1);
          break;
        default:
          startTime.setHours(startTime.getHours() - 24);
      }

      console.log('=== Power Consumption Chart Debug ===');
      console.log('Time Range:', timeRange);
      console.log('Start Time:', startTime.toISOString());
      console.log('End Time:', endTime.toISOString());
      console.log('Selected Device:', currentDevice);

      let readings = [];
      if (currentDevice === 'all') {
        // Fetch readings for all devices
        const devicesResponse = await axios.get(`${config.apiUrl}/api/devices`);
        const activeDevices = devicesResponse.data.filter(device => device.is_active);
        
        console.log('Active Devices:', activeDevices);
        
        const powerReadingsPromises = activeDevices.map(device =>
          axios.get(`${config.apiUrl}/api/devices/${device.id}/readings`, {
            params: {
              start_time: startTime.toISOString(),
              end_time: endTime.toISOString()
            }
          })
        );
        
        const powerReadingsResponses = await Promise.all(powerReadingsPromises);
        readings = powerReadingsResponses.flatMap(response => response.data);
      } else {
        // Fetch readings for a specific device
        console.log('Fetching readings for device:', currentDevice);
        const response = await axios.get(`${config.apiUrl}/api/devices/${currentDevice}/readings`, {
          params: {
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString()
          }
        });
        readings = response.data;
      }

      console.log('Raw Readings:', readings);
      console.log('Number of Readings:', readings.length);

      // Process and format the readings based on time range
      const processedData = processReadings(readings);
      console.log('Processed Data:', processedData);
      console.log('Number of Processed Data Points:', processedData.length);
      
      setData(processedData);
    } catch (error) {
      console.error('Error fetching power consumption data:', error);
      setError('Failed to fetch power consumption data');
      fetchSampleData();
    } finally {
      setLoading(false);
    }
  }, [timeRange, currentDevice, useSampleData, fetchSampleData]);

  // Update currentDevice when deviceId or selectedDevice prop changes
  useEffect(() => {
    console.log('Device changed:', deviceId || selectedDevice);
    setCurrentDevice(deviceId || selectedDevice);
    if (!useSampleData) {
      fetchData();
    }
  }, [deviceId, selectedDevice]);

  // Fetch devices on component mount
  useEffect(() => {
    fetchDevices();
  }, []);

  // Fetch data when timeRange, currentDevice, or useSampleData changes
  useEffect(() => {
    console.log('Fetching data for device:', currentDevice);
    if (useSampleData) {
      fetchSampleData();
    } else {
      fetchData();
    }
  }, [timeRange, currentDevice, useSampleData, fetchData]);

  // Set up refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (!useSampleData) {
        fetchData();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [useSampleData, fetchData]);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${config.apiUrl}/api/devices`);
      setDevices(response.data);
    } catch (error) {
      console.error('Error fetching devices:', error);
      setError('Failed to fetch devices');
      setDevices(sampleDevices);
    } finally {
      setLoading(false);
    }
  };

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

  const processReadings = (readings) => {
    if (!readings || readings.length === 0) {
      return [];
    }

    const RATE_PER_KWH = 0.15; // $0.15 per kWh
    const data = [];

    switch (timeRange) {
      case 'hourly':
        // Group by hour
        const hourlyData = {};
        readings.forEach(reading => {
          const hour = new Date(reading.timestamp).getHours();
          if (!hourlyData[hour]) {
            hourlyData[hour] = {
              hour: `${hour}:00`,
              consumption: 0,
              count: 0,
              totalEnergy: 0 // Watt-hours
            };
          }
          hourlyData[hour].consumption += reading.power;
          hourlyData[hour].count += 1;
          // Calculate energy for this reading (assuming readings are ~5 minutes apart)
          hourlyData[hour].totalEnergy += (reading.power * (5/60)); // Convert to watt-hours
        });

        // Calculate averages and format data
        Object.values(hourlyData).forEach(hour => {
          const avgConsumption = Math.round(hour.consumption / hour.count);
          const energyKWh = hour.totalEnergy / 1000; // Convert watt-hours to kilowatt-hours
          data.push({
            hour: hour.hour,
            consumption: avgConsumption,
            cost: Number((energyKWh * RATE_PER_KWH).toFixed(2)) // Cost for the hour
          });
        });
        break;

      case 'daily':
        // Group by day
        const dailyData = {};
        readings.forEach(reading => {
          const day = new Date(reading.timestamp).toLocaleDateString('en-US', { weekday: 'short' });
          if (!dailyData[day]) {
            dailyData[day] = {
              day,
              consumption: 0,
              count: 0,
              totalEnergy: 0 // Watt-hours
            };
          }
          dailyData[day].consumption += reading.power;
          dailyData[day].count += 1;
          // Calculate energy for this reading (assuming readings are ~5 minutes apart)
          dailyData[day].totalEnergy += (reading.power * (5/60)); // Convert to watt-hours
        });

        // Calculate averages and format data
        Object.values(dailyData).forEach(day => {
          const avgConsumption = Math.round(day.consumption / day.count);
          const energyKWh = day.totalEnergy / 1000; // Convert watt-hours to kilowatt-hours
          data.push({
            day: day.day,
            consumption: avgConsumption,
            cost: Number((energyKWh * RATE_PER_KWH).toFixed(2)) // Cost for the day
          });
        });
        break;

      case 'monthly':
        // Group by month
        const monthlyData = {};
        readings.forEach(reading => {
          const month = new Date(reading.timestamp).toLocaleDateString('en-US', { month: 'short' });
          if (!monthlyData[month]) {
            monthlyData[month] = {
              month,
              consumption: 0,
              count: 0,
              totalEnergy: 0 // Watt-hours
            };
          }
          monthlyData[month].consumption += reading.power;
          monthlyData[month].count += 1;
          // Calculate energy for this reading (assuming readings are ~5 minutes apart)
          monthlyData[month].totalEnergy += (reading.power * (5/60)); // Convert to watt-hours
        });

        // Calculate averages and format data
        Object.values(monthlyData).forEach(month => {
          const avgConsumption = Math.round(month.consumption / month.count);
          const energyKWh = month.totalEnergy / 1000; // Convert watt-hours to kilowatt-hours
          data.push({
            month: month.month,
            consumption: avgConsumption,
            cost: Number((energyKWh * RATE_PER_KWH).toFixed(2)) // Cost for the month
          });
        });
        break;
    }

    return data.sort((a, b) => {
      const timeA = a[timeRange === 'hourly' ? 'hour' : timeRange === 'daily' ? 'day' : 'month'];
      const timeB = b[timeRange === 'hourly' ? 'hour' : timeRange === 'daily' ? 'day' : 'month'];
      return timeA.localeCompare(timeB);
    });
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
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Power Consumption
        </Typography>
        <Box display="flex" gap={2}>
          {!deviceId && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Device</InputLabel>
              <Select
                value={currentDevice}
                label="Device"
                onChange={handleDeviceChange}
              >
                <MenuItem value="all">All Devices</MenuItem>
                {devices.map((device) => (
                  <MenuItem key={device.id} value={device.id}>
                    {device.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={handleTimeRangeChange}
            size="small"
          >
            <ToggleButton value="hourly">Hourly</ToggleButton>
            <ToggleButton value="daily">Daily</ToggleButton>
            <ToggleButton value="monthly">Monthly</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

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