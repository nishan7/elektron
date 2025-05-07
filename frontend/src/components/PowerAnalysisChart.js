import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, CircularProgress, Alert
} from '@mui/material';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line,
  ReferenceLine
} from 'recharts';
import { formatPower } from '../utils/formatting';
import API from '../API';

// Remove mock thresholds - they will come from props
// const POWER_THRESHOLD_WATTS = 2500; 
// const COST_THRESHOLD_DOLLARS = 0.50; 

// Accept threshold props with default values
const PowerAnalysisChart = ({ 
  selectedDevice, 
  selectedTimeRange, 
  powerThreshold = null, 
  costThreshold = null 
}) => {
  // Log received props at the beginning
  console.log("[PowerAnalysisChart] Rendering. Received Props:", { powerThreshold, costThreshold });

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

  // Define threshold colors and styles for consistency
  const powerThresholdColor = "orange";
  const powerThresholdDash = "3 3";
  const costThresholdColor = "#2ca02c"; // A distinct green
  const costThresholdDash = "2 4"; // Dotted pattern

  // Define tooltip formatter function separately for clarity
  const tooltipFormatter = (value, name, props) => {
    // props.payload contains the data for the hovered point, e.g., { hour: 10, consumption: 2600, cost: 0.65 }
    const payload = props.payload;
    let formattedValue = value; // Start with the original value
    let warning = '';

    if (name === "Power (W)") {
      formattedValue = formatPower(value); // Format the power value
      // Check against power threshold if it's valid and payload exists
      if (payload && typeof powerThreshold === 'number' && powerThreshold > 0 && payload.consumption > powerThreshold) {
        warning = ' (Threshold Exceeded)';
      }
    } else if (name === "Cost ($)") {
      formattedValue = `$${Number(value).toFixed(2)}`; // Format the cost value
      // Check against cost threshold if it's valid and payload exists
      if (payload && typeof costThreshold === 'number' && costThreshold > 0 && payload.cost > costThreshold) {
        warning = ' (Threshold Exceeded)';
      }
    } else if (name === "Avg Power (W)") { // Handle the daily trend chart case
       formattedValue = formatPower(value); 
       // Decide if/how thresholds apply to daily averages
       // if (payload && typeof powerThreshold === 'number' && powerThreshold > 0 && payload.consumption > powerThreshold) { warning = ' (Threshold Exceeded)'; }
    }
    
    // Combine formatted value and warning message
    return [`${formattedValue}${warning}`, name];
  };

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
              <LineChart data={chartData.hourlyData} height={300}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={(tick) => `${tick}:00`} name="Hour"/>
                <YAxis 
                  yAxisId="left" 
                  orientation="left" 
                  stroke="#8884d8" 
                  domain={[0, 'auto']} 
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#82ca9d" 
                  tickFormatter={(value) => `$${value.toFixed(2)}`}
                />
                <Tooltip formatter={tooltipFormatter}/>
                <Legend />

                {/* Add Dummy lines for Legend */}
                {/* These lines don't plot real data but add entries to the legend */}
                {typeof powerThreshold === 'number' && powerThreshold > 0 && (
                  <Line 
                    dataKey="dummyPowerThreshold" // Non-existent data key
                    name={`Power Threshold (${formatPower(powerThreshold)})`} 
                    stroke={powerThresholdColor} 
                    strokeDasharray={powerThresholdDash} 
                    strokeWidth={2} // Match visual thickness if needed
                    legendType="line" // Ensure it looks like a line in legend
                    connectNulls={false} // Don't connect missing points
                    dot={false} // No dots on this dummy line
                    activeDot={false} // No active dots
                    yAxisId="left" // Associate with correct axis if needed by Legend?
                  />
                )}
                 {typeof costThreshold === 'number' && costThreshold > 0 && (
                   <Line 
                    dataKey="dummyCostThreshold" // Non-existent data key
                    name={`Cost Threshold ($${Number(costThreshold).toFixed(2)})`} 
                    stroke={costThresholdColor} 
                    strokeDasharray={costThresholdDash} 
                    strokeWidth={2}
                    legendType="line"
                    connectNulls={false}
                    dot={false}
                    activeDot={false}
                    yAxisId="right"
                  />
                )}

                {/* Real Data Lines - Render AFTER dummy lines */}
                <Line yAxisId="left" type="monotone" dataKey="consumption" name="Power (W)" stroke="#8884d8" activeDot={{ r: 8 }} dot={{r:3}} />
                <Line yAxisId="right" type="monotone" dataKey="cost" name="Cost ($)" stroke="#82ca9d" activeDot={{ r: 8 }} dot={{r:3}} />

                {/* Reference Lines - Render AFTER real lines? Or before? Test placement. Render after dummy legend lines. */}
                {typeof powerThreshold === 'number' && powerThreshold > 0 && (
                  <ReferenceLine 
                    y={Number(powerThreshold)} 
                    yAxisId="left" 
                    // label removed
                    stroke={powerThresholdColor} 
                    strokeDasharray={powerThresholdDash} 
                  />
                )}
                {typeof costThreshold === 'number' && costThreshold > 0 && (
                  <ReferenceLine 
                    y={Number(costThreshold)} 
                    yAxisId="right" 
                    // label removed
                    stroke={costThresholdColor} // Changed color
                    strokeDasharray={costThresholdDash} // Changed dash pattern
                  />
                )}
                
                {/* Render Legend last */}
                <Legend /> 

              </LineChart>
            </ResponsiveContainer>) :
          selectedTimeRange !== '24h' && chartData.trendData?.length > 0 ? 
            (<ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" name="Date" /> 
                <YAxis 
                  yAxisId="left" 
                  orientation="left" 
                  stroke="#8884d8" 
                  domain={[0, 'auto']} 
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#82ca9d" 
                  tickFormatter={(value) => `$${value.toFixed(2)}`}
                />
                <Tooltip formatter={tooltipFormatter}/>
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