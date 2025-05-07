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
  Button,
  ButtonGroup,
  Card,
  CardContent, TextField,
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
  ReferenceLine,
} from 'recharts';
import API from "../API";
import { formatPower } from '../utils/formatting';


const generateHourlyData = async (deviceId, startDate, endDate) => {
  const params = {
    start_time: `${startDate}T00:00:00Z`,
    end_time: `${endDate}T23:59:59Z`
  };
  console.log(deviceId)
  if (deviceId !== null && deviceId !== 'all') {
    params.device_id = deviceId;
  }
  const response = await API.get('/api/record/hourly-summary', { params });
  return response.data;
};

const generateDailyData = async (deviceId, startDate, endDate) => {
  const params = {
    start_time: `${startDate}T00:00:00Z`,
    end_time: `${endDate}T23:59:59Z`
  };
  if (deviceId !== null && deviceId !== 'all') {
    params.device_id = deviceId;
  }
  const response = await API.get('/api/record/daily-summary', { params });
  return response.data;
};

const generateMonthlyData = async (deviceId, year) => {
  const params = { year: year };
  const response = await API.get('/api/record/monthly-summary', { params });
  return response.data;
};


// Add these utility functions after the sample data generators
const calculateStatistics = (data) => {
  const values = data.map(d => d.consumption);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  return { mean, stdDev };
};

const detectAnomalies = (data, sensitivity = 2) => {
  const { mean, stdDev } = calculateStatistics(data);
  return data.map(point => ({
    ...point,
    isAnomaly: Math.abs(point.consumption - mean) > (sensitivity * stdDev),
    anomalyScore: Math.abs(point.consumption - mean) / stdDev,
    expectedRange: {
      min: mean - (sensitivity * stdDev),
      max: mean + (sensitivity * stdDev)
    }
  }));
};

function PowerConsumptionChart({ selectedDevice = 'all', onDeviceChange }) {
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('hourly');
  const [data, setData] = useState([]);
  const [currentDevice, setCurrentDevice] = useState(null);
  const [thresholds, setThresholds] = useState({
    warning: 80,
    critical: 90,
  });
  // Add state for startDate and endDate
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  // Device options state
  const [deviceOptions, setDeviceOptions] = useState([]);
  // Use stored state for startDateStr and endDateStr
  const startDateStr = startDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDateStr = endDate || new Date().toISOString().split('T')[0];

  const fetchData = useCallback(async () => {
    setLoading(true);
    // Guard: if no currentDevice and not monthly, skip API call
    if (!currentDevice && timeRange !== 'monthly') {
      setData([]);
      setLoading(false);
      return;
    }
    let sampleData;
    if (timeRange === 'hourly') {
      sampleData = generateHourlyData(currentDevice, startDateStr, endDateStr);
    } else if (timeRange === 'daily') {
      sampleData = generateDailyData(currentDevice, startDateStr, endDateStr);
    } else if (timeRange === 'monthly') {
      const year = startDateStr.substring(0, 4);
      console.log('Calling generateMonthlyData with:', currentDevice, year);
      sampleData = generateMonthlyData(currentDevice, year);
    } else {
      sampleData = generateHourlyData(currentDevice, startDateStr, endDateStr);
    }
    // Add anomaly detection
    const dataWithAnomalies = detectAnomalies(await sampleData);
    setData(dataWithAnomalies);
    setLoading(false);
  }, [timeRange, currentDevice, startDateStr, endDateStr]);

  // Update currentDevice when selectedDevice prop changes
  useEffect(() => {
    setCurrentDevice(selectedDevice ?? null);
  }, [selectedDevice]);

  // Fetch data when timeRange or currentDevice changes
  useEffect(() => {
    fetchData();
  }, [timeRange, currentDevice, fetchData]);

  // Fetch the device list from API on mount
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await API.get('/api/device');
        setDeviceOptions(res.data);
        console.log(res.data)
      } catch (err) {
        console.error('Failed to fetch devices:', err);
      }
    };
    fetchDevices();
  }, []);

  const handleTimeRangeChange = (event, newValue) => {
    if (newValue !== null) {
      setTimeRange(newValue);
    }
  };

  const handleDeviceChange = (event) => {
    const newDevice = event.target.value;
    console.log(newDevice, event.target);
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

  const getPowerStatus = (power) => {
    const maxPower = currentDevice ? parseInt(currentDevice.powerRating) : 1000;
    const percentage = (power / maxPower) * 100;

    if (percentage >= thresholds.critical) {
      return 'critical';
    } else if (percentage >= thresholds.warning) {
      return 'warning';
    }
    return 'normal';
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      const power = point.consumption;
      const cost = point.cost;
      const status = getPowerStatus(power);
      const isAnomaly = point.isAnomaly;

      return (
        <Card>
          <CardContent>
            <Typography variant="subtitle2">Time: {label}</Typography>
            <Typography variant="body2" color={status === 'critical' ? 'error' : status === 'warning' ? 'warning' : 'textPrimary'}>
              Power: {formatPower(power)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Cost: ${cost.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Status: {status.toUpperCase()}
            </Typography>
            {isAnomaly && (
              <>
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  ⚠️ Unusual Consumption Detected
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Expected Range: {formatPower(point.expectedRange.min, { decimalPlaces: 0 })} - {formatPower(point.expectedRange.max, { decimalPlaces: 0 })}
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block">
                  Anomaly Score: {point.anomalyScore.toFixed(2)}
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const activeDevice = deviceOptions.find(d => d._id === currentDevice);

  return (
    <Paper sx={{ p: 3 }}>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Device</InputLabel>
            <Select
              value={currentDevice ?? ''}
              onChange={handleDeviceChange}
              label="Device"
            >
              <MenuItem value="">Select a Device</MenuItem>
              <MenuItem value="all">All Devices</MenuItem>
              {deviceOptions.map((device, index) => (
                <MenuItem key={device._id || index} value={device._id}>
                  {device.name || `Device ${index + 1}`}
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
        {/* Removed Start Date and End Date input fields */}
      </Grid>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          {activeDevice?.name || 'Select a Device'} Power Consumption
        </Typography>
        <ButtonGroup size="small">
          <Button
            variant={timeRange === 'hourly' ? 'contained' : 'outlined'}
            onClick={() => {
              setTimeRange('hourly');
              const end = new Date();
              const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
              setStartDate(start.toISOString().split('T')[0]);
              setEndDate(end.toISOString().split('T')[0]);
            }}
          >
            24 Hours
          </Button>
          <Button
            variant={timeRange === 'daily' ? 'contained' : 'outlined'}
            onClick={() => {
              setTimeRange('daily');
              const end = new Date();
              const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
              setStartDate(start.toISOString().split('T')[0]);
              setEndDate(end.toISOString().split('T')[0]);
            }}
          >
            7 Days
          </Button>
          <Button
            variant={timeRange === 'monthly' ? 'contained' : 'outlined'}
            onClick={() => {
              setTimeRange('monthly');
              const end = new Date();
              const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
              setStartDate(start.toISOString().split('T')[0]);
              setEndDate(end.toISOString().split('T')[0]);
            }}
          >
            30 Days
          </Button>
        </ButtonGroup>
      </Box>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Current Power
              </Typography>
              <Typography variant="h4">
                {formatPower(data[data.length - 1]?.consumption || 0)}
              </Typography>
              <Typography
                variant="body2"
                color={getPowerStatus(data[data.length - 1]?.consumption || 0) === 'critical' ? 'error' : 'textSecondary'}
              >
                Status: {getPowerStatus(data[data.length - 1]?.consumption || 0).toUpperCase()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Average Power
              </Typography>
              <Typography variant="h4">
                {formatPower(data.length > 0 ? data.reduce((acc, curr) => acc + curr.consumption, 0) / data.length : 0, { decimalPlaces: 0 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Peak Power
              </Typography>
              <Typography variant="h4">
                {formatPower(data.length > 0 ? Math.max(...data.map(d => d.consumption)) : 0, { decimalPlaces: 0 })}
              </Typography>
            </CardContent>
          </Card>
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
            <Tooltip content={<CustomTooltip />} />
            <Legend
              content={({ payload }) => (
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
                  {payload?.map((entry, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          backgroundColor: entry.color,
                          borderRadius: '50%'
                        }}
                      />
                      <Typography variant="caption">
                        {entry.value}
                      </Typography>
                    </Box>
                  ))}
                  {data[0]?.expectedRange && (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            backgroundColor: 'transparent',
                            border: '2px dashed #ff0000',
                            borderRadius: '50%'
                          }}
                        />
                        <Typography variant="caption" color="textSecondary">
                          Normal Range: {data[0]?.expectedRange ? `${formatPower(data[0].expectedRange.min, { decimalPlaces: 0 })} - ${formatPower(data[0].expectedRange.max, { decimalPlaces: 0 })}` : 'N/A'}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              )}
            />
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
            <ReferenceLine
              yAxisId="left"
              y={data[0]?.expectedRange?.max}
              stroke="red"
              strokeDasharray="3 3"
            />
            <ReferenceLine
              yAxisId="left"
              y={data[0]?.expectedRange?.min}
              stroke="red"
              strokeDasharray="3 3"
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