import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, FormControl, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getAggregatedPowerData } from '../api/recordsApi';

const HistoricalTrendsChart = ({ deviceId = null }) => {
  const [data, setData] = useState([]);
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch data from our API service
        const chartData = await getAggregatedPowerData(deviceId, timeRange);
        
        // Process data to show the trend as a cumulative value
        const trendData = chartData.map((item, index, array) => {
          // Calculate moving average for the trend
          const windowSize = 3; // 3-day moving average
          const startIdx = Math.max(0, index - windowSize + 1);
          const window = array.slice(startIdx, index + 1);
          const avgValue = window.reduce((sum, curr) => sum + curr.averagePower, 0) / window.length;
          
          return {
            ...item,
            trendValue: avgValue
          };
        });
        
        setData(trendData);
      } catch (err) {
        console.error('Error fetching historical trends data:', err);
        setError('Failed to load historical trends data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [deviceId, timeRange]);

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  // Sample data for visualization if no real data is available
  const sampleData = [
    { date: '2025-04-01', averagePower: 110, trendValue: 108 },
    { date: '2025-04-08', averagePower: 130, trendValue: 120 },
    { date: '2025-04-15', averagePower: 125, trendValue: 126 },
    { date: '2025-04-22', averagePower: 155, trendValue: 140 },
    { date: '2025-04-29', averagePower: 145, trendValue: 150 },
    { date: '2025-05-06', averagePower: 175, trendValue: 160 }
  ];

  const displayData = data.length > 0 ? data : sampleData;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            Historical Trends
          </Typography>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={handleTimeRangeChange}
              label="Time Range"
            >
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
              <MenuItem value="180d">Last 6 Months</MenuItem>
              <MenuItem value="365d">Last Year</MenuItem>
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
            <LineChart data={displayData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis label={{ value: 'Power (W)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => [`${value.toFixed(2)} W`, undefined]} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="averagePower" 
                name="Daily Power" 
                stroke="#8884d8" 
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="trendValue" 
                name="Trend" 
                stroke="#ff7300" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default HistoricalTrendsChart; 