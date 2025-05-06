import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, FormControl, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getComparisonData } from '../api/recordsApi';

const UsageComparisonChart = () => {
  const [data, setData] = useState([]);
  const [comparisonType, setComparisonType] = useState('devices'); // 'devices' or 'timeperiods'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (comparisonType === 'devices') {
          // Compare all devices over the same time period
          const comparisonData = await getComparisonData([], ['30d']);
          
          // Format data for the bar chart
          const chartData = comparisonData.map(item => ({
            name: item.deviceName,
            power: parseFloat(item.avgPower.toFixed(2))
          }));
          
          setData(chartData);
        } else {
          // Compare one device over different time periods
          // For demo, we'll use the first device and compare different periods
          const firstDeviceId = await getComparisonData([], ['7d']).then(data => data[0]?.deviceId);
          
          if (firstDeviceId) {
            const timeRanges = ['7d', '30d', '90d'];
            const comparisonData = await getComparisonData([firstDeviceId], timeRanges);
            
            // Format data for the bar chart
            const chartData = comparisonData.map(item => ({
              name: formatTimeRangeLabel(item.timeRange),
              power: parseFloat(item.avgPower.toFixed(2))
            }));
            
            setData(chartData);
          } else {
            setData([]);
          }
        }
      } catch (err) {
        console.error('Error fetching comparison data:', err);
        setError('Failed to load comparison data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [comparisonType]);

  const handleComparisonTypeChange = (event) => {
    setComparisonType(event.target.value);
  };
  
  const formatTimeRangeLabel = (range) => {
    switch (range) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      default: return range;
    }
  };

  // Sample data for visualization if no real data is available
  const sampleDevicesData = [
    { name: 'Living Room', power: 245.5 },
    { name: 'Kitchen', power: 384.3 },
    { name: 'Bedroom', power: 175.8 },
    { name: 'Office', power: 290.2 },
    { name: 'Bathroom', power: 120.5 }
  ];
  
  const sampleTimePeriodsData = [
    { name: 'Last 7 Days', power: 245.5 },
    { name: 'Last 30 Days', power: 287.3 },
    { name: 'Last 90 Days', power: 312.8 }
  ];

  const displayData = data.length > 0 ? 
    data : 
    (comparisonType === 'devices' ? sampleDevicesData : sampleTimePeriodsData);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            Usage Comparison
          </Typography>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Compare</InputLabel>
            <Select
              value={comparisonType}
              onChange={handleComparisonTypeChange}
              label="Compare"
            >
              <MenuItem value="devices">Devices</MenuItem>
              <MenuItem value="timeperiods">Time Periods</MenuItem>
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
            <BarChart data={displayData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Avg Power (W)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => [`${value} W`, 'Average Power']} />
              <Legend />
              <Bar 
                dataKey="power" 
                name="Average Power" 
                fill="#8884d8" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default UsageComparisonChart; 