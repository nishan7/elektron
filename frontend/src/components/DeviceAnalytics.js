import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Stack,
  IconButton,
  Tooltip as MuiTooltip,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

const DeviceAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [deviceData, setDeviceData] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');
  const [metrics, setMetrics] = useState(null);

  // Sample devices for the filter
  const devices = [
    { id: 'all', name: 'All Devices' },
    { id: '1', name: 'HVAC Unit 1' },
    { id: '2', name: 'Lighting Panel A' },
    { id: '3', name: 'Server Room' },
    { id: '4', name: 'Main Distribution' },
  ];

  useEffect(() => {
    const generateDeviceData = () => {
      // Generate sample device data with more business metrics
      const data = {
        hourlyData: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          consumption: Math.floor(Math.random() * 1000),
          cost: Math.floor(Math.random() * 100),
          efficiency: Math.floor(70 + Math.random() * 30),
          savings: Math.floor(Math.random() * 50),
        })),
        trendData: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
          consumption: Math.floor(800 + Math.random() * 400),
          cost: Math.floor(80 + Math.random() * 40),
        })),
      };
      return data;
    };

    const generateMetrics = () => ({
      totalConsumption: Math.floor(Math.random() * 10000),
      totalCost: Math.floor(Math.random() * 1000),
      costSavings: Math.floor(Math.random() * 200),
      efficiency: Math.floor(70 + Math.random() * 30),
      carbonReduction: Math.floor(Math.random() * 100),
      roi: Math.floor(Math.random() * 50),
    });

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setDeviceData(generateDeviceData());
      setMetrics(generateMetrics());
      setLoading(false);
    }, 1000);
  }, [selectedDevice, timeRange]);

  const handleDeviceChange = (event) => {
    setSelectedDevice(event.target.value);
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting data...');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Key Metrics Section */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Key Performance Metrics
              </Typography>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExport}
              >
                Export Report
              </Button>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Consumption
                    </Typography>
                    <Typography variant="h4">
                      {metrics.totalConsumption} kWh
                    </Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      <TrendingDownIcon color="success" />
                      <Typography variant="body2" color="success">
                        12% vs last period
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Cost Savings
                    </Typography>
                    <Typography variant="h4">
                      ${metrics.costSavings}
                    </Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      <TrendingUpIcon color="success" />
                      <Typography variant="body2" color="success">
                        8% improvement
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      System Efficiency
                    </Typography>
                    <Typography variant="h4">
                      {metrics.efficiency}%
                    </Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      <TrendingUpIcon color="success" />
                      <Typography variant="body2" color="success">
                        5% improvement
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      ROI
                    </Typography>
                    <Typography variant="h4">
                      {metrics.roi}%
                    </Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      <TrendingUpIcon color="success" />
                      <Typography variant="body2" color="success">
                        15% increase
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Power Analytics Section */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="h6">
                  Power Analytics
                </Typography>
                <Stack direction="row" spacing={1} mt={1}>
                  <Chip
                    label="24h"
                    onClick={() => handleTimeRangeChange('24h')}
                    color={timeRange === '24h' ? 'primary' : 'default'}
                  />
                  <Chip
                    label="7d"
                    onClick={() => handleTimeRangeChange('7d')}
                    color={timeRange === '7d' ? 'primary' : 'default'}
                  />
                  <Chip
                    label="30d"
                    onClick={() => handleTimeRangeChange('30d')}
                    color={timeRange === '30d' ? 'primary' : 'default'}
                  />
                </Stack>
              </Box>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Select Device</InputLabel>
                <Select
                  value={selectedDevice}
                  label="Select Device"
                  onChange={handleDeviceChange}
                >
                  {devices.map((device) => (
                    <MenuItem key={device.id} value={device.id}>
                      {device.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                {timeRange === '24h' ? (
                  <BarChart data={deviceData.hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="consumption"
                      name="Power Consumption (W)"
                      fill="#8884d8"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="cost"
                      name="Cost ($)"
                      fill="#82ca9d"
                    />
                  </BarChart>
                ) : (
                  <LineChart data={deviceData.trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="consumption"
                      name="Power Consumption (W)"
                      stroke="#8884d8"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="cost"
                      name="Cost ($)"
                      stroke="#82ca9d"
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Insights Section */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Business Insights
              </Typography>
              <MuiTooltip title="AI-powered insights based on your power consumption patterns">
                <IconButton>
                  <InfoIcon />
                </IconButton>
              </MuiTooltip>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Cost Optimization Opportunities
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      • Peak hour consumption can be reduced by 15% through load shifting
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      • Potential savings of $200/month by optimizing HVAC schedules
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      • Consider upgrading to energy-efficient equipment for 25% better ROI
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Sustainability Impact
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      • {metrics.carbonReduction}kg CO₂ reduction this month
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      • 85% of power consumption during off-peak hours
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      • On track to meet sustainability goals for Q1 2024
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default DeviceAnalytics; 