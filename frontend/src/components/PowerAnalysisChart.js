import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, CircularProgress, Alert
} from '@mui/material';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { formatPower } from '../utils/formatting';
import API from '../API';

// Accepts selectedDevice and selectedTimeRange as props
const PowerAnalysisChart = ({ selectedDevice, selectedTimeRange }) => {
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState(null);
  const [chartData, setChartData] = useState({ hourlyData: [], trendData: [] });

  useEffect(() => {
    const loadChartData = async () => {
      if (!selectedDevice || !selectedTimeRange) {
         setChartLoading(false);
         setChartData({ hourlyData: [], trendData: [] }); // Clear chart data
         return;
      } 
      
      setChartLoading(true);
      setChartError(null);
      setChartData({ hourlyData: [], trendData: [] }); // Clear previous

      // Calculate start/end times (same logic as before)
      const today = new Date();
      let startDate, endDate;
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
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
      }
      const startTimeStr = startDate?.toISOString();
      const endTimeStr = endDate?.toISOString();

      try {
        // Fetch chart data based on selection
        if (selectedTimeRange === '24h') {
          const hourlyResponse = await API.get('/api/record/hourly-summary', {
            params: { 
              device_id: selectedDevice === 'all' ? undefined : selectedDevice,
              start_time: startTimeStr, 
              end_time: endTimeStr 
            }
          });
          const formattedHourlyData = hourlyResponse.data.map(d => ({
              hour: parseInt(d.hour.split(':')[0]),
              consumption: parseFloat(d.consumption) || 0,
              cost: parseFloat(d.cost) || 0
          }));
          setChartData({ hourlyData: formattedHourlyData, trendData: [] });
        } else { // 7d or 30d
          const trendResponse = await API.get('/api/record/daily-trend-for-device', {
            params: { 
              device_id: selectedDevice === 'all' ? undefined : selectedDevice,
              start_time: startTimeStr, 
              end_time: endTimeStr 
            }
          });
          const formattedTrendData = trendResponse.data.map(d => ({
              ...d,
              consumption: parseFloat(d.consumption) || 0,
              cost: parseFloat(d.cost) || 0
          }));
          setChartData({ trendData: formattedTrendData, hourlyData: [] });
        }
      } catch (err) {
        console.error(`Failed to load chart data for ${selectedDevice} (${selectedTimeRange}):`, err);
        setChartError(err.response?.data?.detail || "Could not load chart data.");
        setChartData({ hourlyData: [], trendData: [] }); // Clear chart data on error
      } finally {
        setChartLoading(false);
      }
    };

    loadChartData();
  }, [selectedDevice, selectedTimeRange]); // Depend on props

  // Determine title based on props
  const chartTitle = selectedDevice === 'all' ? 'Overall Power Analysis' : `Device Power Analysis`; // Simpler title for reuse

  return (
    <Card sx={{mb: { xs: 2, md: 0 }}}> {/* Adjust margin as needed */}
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" mb={2} gap={2}>
          <Typography variant="h6">
            {chartTitle} ({selectedTimeRange === '24h' ? 'Hourly' : 'Daily'})
          </Typography>
        </Box>
        <Box height={300} sx={{ position: 'relative' }}>
          {chartLoading && (
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 1 }}>
              <CircularProgress />
            </Box>
          )}
          {chartError && (!chartData.hourlyData?.length && !chartData.trendData?.length) ? 
            (<Box display="flex" justifyContent="center" alignItems="center" height="100%"><Alert severity="error">{chartError || 'Error loading chart data.'}</Alert></Box>) :
          selectedTimeRange === '24h' && chartData.hourlyData?.length > 0 ? 
            (<ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={(tick) => `${tick}:00`} name="Hour"/>
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" domain={[0, 'auto']} />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" tickFormatter={(value) => `$${value.toFixed(2)}`}/>
                <Tooltip formatter={(value, name, props) => {
                    if (name === "Power (W)") return [formatPower(value), name];
                    if (name === "Cost ($)") return [`$${Number(value).toFixed(2)}`, name];
                    return [value, name];
                }}/>
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="consumption" name="Power (W)" stroke="#8884d8" activeDot={{ r: 8 }} dot={{r:3}} />
                <Line yAxisId="right" type="monotone" dataKey="cost" name="Cost ($)" stroke="#82ca9d" activeDot={{ r: 8 }} dot={{r:3}} />
              </LineChart>
            </ResponsiveContainer>) :
          selectedTimeRange !== '24h' && chartData.trendData?.length > 0 ? 
            (<ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" name="Date" /> 
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" domain={[0, 'auto']} />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" tickFormatter={(value) => `$${value.toFixed(2)}`}/>
                <Tooltip formatter={(value, name, props) => {
                    if (name === "Avg Power (W)") return [formatPower(value), name];
                    if (name === "Cost ($)") return [`$${Number(value).toFixed(2)}`, name];
                    return [value, name];
                }}/>
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="consumption" name="Avg Power (W)" stroke="#8884d8" activeDot={{ r: 8 }} />
                <Line yAxisId="right" type="monotone" dataKey="cost" name="Cost ($)" stroke="#82ca9d" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>) :
          !chartLoading && (<Box display="flex" justifyContent="center" alignItems="center" height="100%"><Typography color="text.secondary">No chart data available for this selection.</Typography></Box>)
          }
        </Box>
      </CardContent>
    </Card>
  );
};

export default PowerAnalysisChart; 