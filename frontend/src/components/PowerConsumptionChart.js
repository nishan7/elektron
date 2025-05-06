import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, FormControl, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getAggregatedPowerData } from '../api/recordsApi';

const PowerConsumptionChart = ({ deviceId = null }) => {
  const [data, setData] = useState([]);
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch data from our API service
        const chartData = await getAggregatedPowerData(deviceId, timeRange);
        setData(chartData);
      } catch (err) {
        console.error('Error fetching power consumption data:', err);
        setError('Failed to load power consumption data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [deviceId, timeRange]);

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  // If no data available, provide sample data for visualization
  const sampleData = [
    { date: '2025-05-01', averagePower: 120, minPower: 100, maxPower: 140 },
    { date: '2025-05-02', averagePower: 132, minPower: 105, maxPower: 155 },
    { date: '2025-05-03', averagePower: 145, minPower: 110, maxPower: 180 },
    { date: '2025-05-04', averagePower: 165, minPower: 120, maxPower: 200 },
    { date: '2025-05-05', averagePower: 180, minPower: 130, maxPower: 220 },
    { date: '2025-05-06', averagePower: 195, minPower: 140, maxPower: 240 }
  ];

  const displayData = data.length > 0 ? data : sampleData;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            Power Consumption
          </Typography>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={handleTimeRangeChange}
              label="Time Range"
            >
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={displayData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis label={{ value: 'Power (W)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => [`${value.toFixed(2)} W`, undefined]} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="maxPower" 
                name="Max Power" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.1} 
              />
              <Area 
                type="monotone" 
                dataKey="averagePower" 
                name="Average Power" 
                stroke="#82ca9d" 
                fill="#82ca9d" 
                fillOpacity={0.6} 
              />
              <Area 
                type="monotone" 
                dataKey="minPower" 
                name="Min Power" 
                stroke="#ffc658" 
                fill="#ffc658" 
                fillOpacity={0.1} 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default PowerConsumptionChart; 