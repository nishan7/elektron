import React, { useEffect, useState } from 'react';
import { formatPower } from '../utils/formatting';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import API from '../API';

// Helper to determine API endpoint and params based on selectedTimeRange for load distribution
// This is a placeholder and assumes your backend will have an endpoint that can handle this.
const getLoadDistributionApiConfig = (timeRange, deviceId, startDateStr, endDateStr) => {
  // YOU WILL LIKELY NEED A DEDICATED ENDPOINT FOR THIS ON THE BACKEND
  // This example assumes an endpoint that can take start/end times.
  const endpoint = '/api/record/load-distribution-period'; // Example new endpoint
  const params = {
    start_time: startDateStr ? `${startDateStr}T00:00:00Z` : undefined,
    end_time: endDateStr ? `${endDateStr}T23:59:59Z` : undefined,
    device_id: deviceId === 'all' ? undefined : deviceId,
    // You might add another param like 'group_by' if the backend supports different ways to categorize load
  };

  // If 'all' devices are selected, specify grouping by name for the backend.
  if (deviceId === 'all') {
    params.group_by = 'name';
  }

  // Remove undefined params
  Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
  return { endpoint, params };
};

// Props: selectedDevice (string ID), selectedDeviceName (string), selectedTimeRange (string)
const LoadDistribution = ({ selectedDevice, selectedDeviceName, selectedTimeRange }) => {
  const [loadData, setLoadData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedDevice || !selectedTimeRange) return;

      setLoading(true);
      setError(null);
      try {
        let startDate, endDate;
        const today = new Date();
        switch (selectedTimeRange) {
          case '7d':
            endDate = new Date(today);
            startDate = new Date(new Date().setDate(today.getDate() - 6));
            break;
          case '30d':
            endDate = new Date(today);
            startDate = new Date(new Date().setDate(today.getDate() - 29));
            break;
          case '24h':
          default:
            endDate = new Date(today);
            startDate = new Date(today);
            break;
        }

        const startDateStr = startDate?.toISOString().split('T')[0];
        const endDateStr = endDate?.toISOString().split('T')[0];
        
        const { endpoint, params } = getLoadDistributionApiConfig(selectedTimeRange, selectedDevice, startDateStr, endDateStr);
        
        console.log(`Fetching load distribution for device: ${selectedDevice} (${selectedDeviceName}), timeRange: ${selectedTimeRange}, params:`, params);
        const response = await API.get(endpoint, { params });
        setLoadData(response.data || []);
      } catch (err) {
        console.error("Failed to fetch load distribution data:", err);
        setError("Could not load distribution data. Check API and parameters.");
        setLoadData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDevice, selectedDeviceName, selectedTimeRange]);

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent sx={{ minHeight: 300 }}>
          <Typography variant="h6" gutterBottom>Load Distribution</Typography>
          <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100%">
            <Typography color="error">{error}</Typography>
            <Typography variant="caption" color="text.secondary">API might need update for time-ranged distribution.</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!loadData || loadData.length === 0) {
    return (
      <Card>
        <CardContent sx={{ minHeight: 300 }}>
          <Typography variant="h6" gutterBottom>Load Distribution</Typography>
          <Box display="flex" justifyContent="center" alignItems="center" height="calc(100% - 40px)">
            <Typography color="text.secondary">No load distribution data for this selection.</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const totalValue = loadData.reduce((sum, item) => sum + (item.value || 0), 0);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Load Distribution ({selectedTimeRange}) {selectedDevice !== 'all' && selectedDeviceName ? `for ${selectedDeviceName}` : ' (All Devices)'}
        </Typography>

        <Box height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={loadData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => {
                  const percentage = totalValue > 0 && typeof value === 'number' ? (value / totalValue * 100).toFixed(0) : 0;
                  return `${name} ${percentage}%`;
                }}
              >
                {loadData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [typeof value === 'number' ? `${formatPower(value, {decimalPlaces: 1})} W` : value, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>

        <Grid container spacing={1} sx={{ mt: 2, maxHeight: 150, overflowY: 'auto' }}>
          {loadData.map((item) => (
            <Grid item xs={12} sm={6} key={item.name} title={`${item.name}: ${formatPower(item.value || 0)}`}>
              <Box display="flex" alignItems="center" gap={1} sx={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    backgroundColor: item.color || '#ccc',
                    borderRadius: '50%',
                    flexShrink: 0
                  }}
                />
                <Typography variant="body2" noWrap>
                  {item.name}: {formatPower(item.value || 0)}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default LoadDistribution; 