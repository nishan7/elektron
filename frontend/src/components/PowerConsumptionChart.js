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

// Helper to determine API endpoint and params based on selectedTimeRange
const getDataConfig = (timeRange, deviceId, startDate, endDate, year) => {
  switch (timeRange) {
    case '24h':
      return {
        endpoint: '/api/record/hourly-summary',
        params: { start_time: `${startDate}T00:00:00Z`, end_time: `${endDate}T23:59:59Z`, device_id: deviceId === 'all' ? undefined : deviceId },
        dataKey: 'hour',
      };
    case '7d':
      return {
        endpoint: '/api/record/daily-summary',
        params: { start_time: `${startDate}T00:00:00Z`, end_time: `${endDate}T23:59:59Z`, device_id: deviceId === 'all' ? undefined : deviceId },
        dataKey: 'day',
      };
    case '30d': // For 30 days, we might still want daily summary for a longer period
      return {
        endpoint: '/api/record/daily-summary',
        params: { start_time: `${startDate}T00:00:00Z`, end_time: `${endDate}T23:59:59Z`, device_id: deviceId === 'all' ? undefined : deviceId },
        dataKey: 'day',
      };
    // Add a case for 'monthly' if your parent component can send that, or adapt '30d' to use monthly-summary if appropriate
    // case 'monthly': 
    //   return {
    //     endpoint: '/api/record/monthly-summary',
    //     params: { year: year, device_id: deviceId === 'all' ? undefined : deviceId },
    //     dataKey: 'month',
    //   };
    default:
      return {
        endpoint: '/api/record/hourly-summary',
        params: { start_time: `${startDate}T00:00:00Z`, end_time: `${endDate}T23:59:59Z`, device_id: deviceId === 'all' ? undefined : deviceId },
        dataKey: 'hour',
      };
  }
};

function PowerConsumptionChart({ selectedDevice = 'all', selectedTimeRange }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [thresholds, setThresholds] = useState({
    warning: 80,
    critical: 90,
  });
  const [xAxisDataKey, setXAxisDataKey] = useState('hour');

  const fetchData = useCallback(async () => {
    if (!selectedDevice) return;

    setLoading(true);
    try {
      let startDate, endDate, year;
      const today = new Date();
      switch (selectedTimeRange) {
        case '7d':
          endDate = new Date(today);
          startDate = new Date(today.setDate(today.getDate() - 6)); // Last 7 days including today
          break;
        case '30d':
          endDate = new Date(today);
          startDate = new Date(today.setDate(today.getDate() - 29)); // Last 30 days including today
          break;
        // case 'monthly': // if you add this option in parent
        //   year = new Date().getFullYear().toString(); // Or a selected year
        //   break;
        case '24h':
        default:
          endDate = new Date(today);
          startDate = new Date(today); // Data for today, hourly summary should handle this
          break;
      }

      const startDateStr = startDate?.toISOString().split('T')[0];
      const endDateStr = endDate?.toISOString().split('T')[0];

      const { endpoint, params, dataKey } = getDataConfig(selectedTimeRange, selectedDevice, startDateStr, endDateStr, year);
      setXAxisDataKey(dataKey);
      
      const response = await API.get(endpoint, { params });
      const dataWithAnomalies = detectAnomalies(response.data || []);
      setData(dataWithAnomalies);
    } catch (error) {
      console.error('Failed to fetch power consumption data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDevice, selectedTimeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getPowerStatus = (power) => {
    const maxPower = 1000; // Placeholder until powerRating is properly sourced
    const percentage = (power / maxPower) * 100;
    if (percentage >= thresholds.critical) return 'critical';
    if (percentage >= thresholds.warning) return 'warning';
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
        <Card sx={{backgroundColor: 'background.paper', opacity: 0.9}}>
          <CardContent sx={{p:1}}>
            <Typography variant="subtitle2">Time: {label}</Typography>
            <Typography variant="body2" color={status === 'critical' ? 'error.main' : status === 'warning' ? 'warning.main' : 'text.primary'}>
              Power: {formatPower(power)}
            </Typography>
            {cost !== undefined && (
              <Typography variant="body2" color="text.secondary">
                Cost: ${cost.toFixed(2)}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              Status: {status.toUpperCase()}
            </Typography>
            {isAnomaly && (
              <Box mt={1}>
                <Typography variant="body2" color="error.main" sx={{ fontWeight: 'bold'}}>
                  ⚠️ Unusual Consumption
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Range: {formatPower(point.expectedRange.min, { decimalPlaces: 0 })} - {formatPower(point.expectedRange.max, { decimalPlaces: 0 })}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Score: {point.anomalyScore?.toFixed(2) ?? 'N/A'}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={{ xs: 200, sm: 300, md: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={{ xs: 200, sm: 300, md: 400 }}>
        <Typography color="text.secondary">No data available for the selected period.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box height={{ xs: 300, sm: 350, md: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisDataKey} />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="consumption" strokeWidth={2} stroke={thresholds.critical ? "#1976d2" : "#8884d8" } name="Power Consumption" dot={{ r: 2 }} activeDot={{ r: 6 }}/>
            {data[0]?.expectedRange?.max !== undefined && (
              <ReferenceLine yAxisId="left" y={data[0].expectedRange.max} stroke="red" strokeDasharray="3 3" />
            )}
            {data[0]?.expectedRange?.min !== undefined && (
              <ReferenceLine yAxisId="left" y={data[0].expectedRange.min} stroke="red" strokeDasharray="3 3" />
            )}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}

export default PowerConsumptionChart; 