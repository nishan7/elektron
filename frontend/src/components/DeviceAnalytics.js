// frontend/src/components/DeviceAnalytics.js

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, CircularProgress, FormControl,
  InputLabel, Select, MenuItem, Button, Chip, Stack, IconButton,
  Tooltip as MuiTooltip, Alert
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
import {
  TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon, Download as DownloadIcon, Info as InfoIcon
} from '@mui/icons-material';
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatPower } from '../utils/formatting';
import API from '../API'; // Make sure API helper is correctly imported and configured
import PowerAnalysisChart from './PowerAnalysisChart'; // IMPORT the new component

// Removed placeholder fetchDeviceAnalyticsData function

// Props: selectedDevice (string ID), selectedDeviceName (string), selectedTimeRange (string)
const DeviceAnalytics = ({ selectedDevice, selectedDeviceName, selectedTimeRange }) => {
  console.log("--- DeviceAnalytics RENDER START ---", { selectedDevice, selectedDeviceName, selectedTimeRange });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State to hold the summary data fetched from the backend
  const [analyticsSummary, setAnalyticsSummary] = useState({
       deviceName: null, deviceType: null, averagePower: null, peakPower: null,
       minPower: null, totalConsumption: null, peakPowerTimestamp: null, peakHours: []
  });

  const [generatedInsights, setGeneratedInsights] = useState('');
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState(null);

  const genAI = useMemo(() => {
    const apiKey = 'AIzaSyDqlpgkqFKsBKXOknT9oWvXF5QdNWyeTdg';
    if (!apiKey) { console.error("API Key not found."); setInsightsError("API Key is missing."); return null; }
    try { return new GoogleGenerativeAI(apiKey); }
    catch (error) { console.error("Error initializing GoogleGenerativeAI:", error); setInsightsError("Failed to initialize AI Client."); return null; }
  }, []);

  useEffect(() => {
    const loadAnalyticsSummary = async () => {
      if (!selectedDevice || !selectedTimeRange) {
         setLoading(false);
         return;
      } 
      
      setLoading(true); 
      setError(null);
      setInsightsError(null);
      setGeneratedInsights('');

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
          startDate.setHours(0, 0, 0, 0); // Start of today for hourly
          endDate.setHours(23, 59, 59, 999); // End of today for hourly
          break;
      }
      const startTimeStr = startDate?.toISOString();
      const endTimeStr = endDate?.toISOString();

      try {
        // Fetch analytics summary (this already handles 'all' by passing undefined)
        const summaryResponse = await API.get('/api/record/device-analytics-summary', {
            params: { 
                device_id: selectedDevice === 'all' ? undefined : selectedDevice,
                start_time: startTimeStr, end_time: endTimeStr
            }
        });
        setAnalyticsSummary(summaryResponse.data);
      } catch (err) {
        console.error(`Failed to load summary data for ${selectedDevice}:`, err);
        setError(err.response?.data?.detail || "Could not load summary.");
        setAnalyticsSummary({ deviceName: null, deviceType: null, averagePower: null, peakPower: null, minPower: null, totalConsumption: null, peakPowerTimestamp: null, peakHours: [] });
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsSummary();
  }, [selectedDevice, selectedTimeRange]);

  const handleGenerateInsights = async () => {
    if (!genAI) { setInsightsError("AI Client not initialized."); return; }
    if (!analyticsSummary || analyticsSummary.averagePower === null) { 
        setInsightsError("Analytics data not available for analysis.");
        return;
    }
    setInsightsLoading(true);
    setGeneratedInsights('');
    setInsightsError(null);

    let prompt = '';
    const isAllDevices = selectedDevice === 'all';

    if (isAllDevices) {
      prompt = `
        Analyze the following aggregated power usage data for ALL devices over the selected period (${selectedTimeRange}):

        Overall Key Metrics:
        - Overall Average Power Consumption: ${formatPower(analyticsSummary.averagePower)}
        - Overall Peak Power Consumption (highest single reading): ${formatPower(analyticsSummary.peakPower)}
        - Overall Total Energy Consumption: ${formatPower(analyticsSummary.totalConsumption, { kwThreshold: Infinity, decimalPlaces: 0 })}
        - Peak Usage Hours (Hour of day, 0-23, for total consumption): ${analyticsSummary.peakHours?.join(', ') || 'N/A'}

        Based *specifically* on these aggregated metrics:
        1.  **Identify General Trends & Potential Concerns:** Are there any notable overall patterns, high consumption periods, or potential areas for general energy saving across the facility/system? Explain your reasoning based on the data provided (e.g., high average consumption, specific peak hours for overall load).
        2.  **Provide General Actionable Recommendations:** Suggest broad, practical steps that could be taken to optimize overall energy usage, improve general efficiency, or investigate widespread patterns. These recommendations should be general due to the aggregated nature of the data.

        Format the response clearly using Markdown, separating trends/concerns and recommendations. Be concise and focus on insights derived *directly* from the provided numbers.
      `;
    } else {
      // Existing prompt for specific device
      prompt = `
        Analyze the following power usage data for the device named "${analyticsSummary.deviceName || selectedDeviceName}" (Type: ${analyticsSummary.deviceType || 'Unknown'}) over the selected period (${selectedTimeRange}):

        Key Metrics:
        - Average Power Consumption: ${formatPower(analyticsSummary.averagePower)}
        - Peak Power Consumption: ${formatPower(analyticsSummary.peakPower)} (occurred around ${analyticsSummary.peakPowerTimestamp ? new Date(analyticsSummary.peakPowerTimestamp).toLocaleString() : 'N/A'})
        - Minimum Power Consumption (Standby): ${formatPower(analyticsSummary.minPower)}
        - Total Energy Consumption: ${formatPower(analyticsSummary.totalConsumption, { kwThreshold: Infinity, decimalPlaces: 0 })} 
        - Peak Usage Hours (Hour of day, 0-23, highest average for this device): ${analyticsSummary.peakHours?.join(', ') || 'N/A'}

        Based *specifically* on these metrics and the device type:
        1.  **Identify Potential Problems:** Are there signs of inefficiency, unusual peaks, high standby usage, unexpected usage times, or other potential issues? Explain your reasoning based on the data provided (e.g., comparing min power to average/peak, considering peak hours for the device type).
        2.  **Provide Actionable Recommendations:** Suggest specific, practical steps the user could take to optimize energy usage, improve efficiency, investigate potential problems, or adjust usage patterns for this device. Tailor recommendations to the device type where possible.

        Format the response clearly using Markdown, separating problems and recommendations. Be concise and focus on insights derived *directly* from the provided numbers.
      `;
    }
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      setGeneratedInsights(result.response.text());
    } catch (error) {
      console.error("Error generating insights:", error);
      setInsightsError(`Failed to generate insights. Error: ${error.message || 'Unknown error'}`);
    } finally {
      setInsightsLoading(false);
    }
  };

  // Display loading indicator or message if loading or no specific device selected
  if (loading) {
    return (
        <Card>
            <CardContent sx={{minHeight: 400, display:'flex', justifyContent:'center', alignItems:'center'}}>
                <CircularProgress />
            </CardContent>
        </Card>
    );
  }
  if (error && !analyticsSummary.averagePower) {
    return (
      <Card>
        <CardContent sx={{minHeight: 400}}>
            <Alert severity="error">{error}</Alert>
        </CardContent>
       </Card>
    );
  }

  // Log state just before returning main JSX, including averagePower explicitly
  console.log("--- DeviceAnalytics PRE-RETURN STATE ---", { 
    loading, 
    error, 
    selectedDevice, 
    analyticsSummary, 
    avgPowerValue: analyticsSummary?.averagePower // Log the specific value
  }); 
  // Main component rendering using analyticsSummary
  return (
    <>
      {/* Key Metrics Section */}
        <Card sx={{mb: 3}}> 
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Key Metrics for {analyticsSummary.deviceName || (selectedDevice === 'all' ? 'All Devices' : selectedDeviceName)}</Typography>
            </Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
               <Grid item xs={12} sm={6} md={3}><Card variant="outlined"><CardContent><Typography variant="subtitle2" color="text.secondary" gutterBottom>Average Power</Typography><Typography variant="h5" sx={{ mb: 1 }}>{formatPower(analyticsSummary.averagePower ?? 0)}</Typography></CardContent></Card></Grid>
               <Grid item xs={12} sm={6} md={3}><Card variant="outlined"><CardContent><Typography variant="subtitle2" color="text.secondary" gutterBottom>Peak Power</Typography><Typography variant="h5" sx={{ mb: 1 }}>{formatPower(analyticsSummary.peakPower ?? 0)}</Typography></CardContent></Card></Grid>
               {analyticsSummary.minPower !== null && 
                 <Grid item xs={12} sm={6} md={3}><Card variant="outlined"><CardContent><Typography variant="subtitle2" color="text.secondary" gutterBottom>Min Power (Standby)</Typography><Typography variant="h5" sx={{ mb: 1 }}>{formatPower(analyticsSummary.minPower ?? 0)}</Typography></CardContent></Card></Grid>
               }
               <Grid item xs={12} sm={6} md={3}><Card variant="outlined"><CardContent><Typography variant="subtitle2" color="text.secondary" gutterBottom>Total Consumption</Typography><Typography variant="h5" sx={{ mb: 1 }}>{formatPower(analyticsSummary.totalConsumption ?? 0, { kwThreshold: Infinity, decimalPlaces: 0 })} Wh</Typography></CardContent></Card></Grid>
            </Grid>
          </CardContent>
        </Card>

      {/* Render PowerAnalysisChart component instead of inline chart JSX */}
      <PowerAnalysisChart 
          selectedDevice={selectedDevice} 
          selectedTimeRange={selectedTimeRange} 
      />

      {/* Insights Section */}
        <Card sx={{mt: 3}}> 
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Insights (AI Generated)</Typography>
              <Button variant="contained" size="small" onClick={handleGenerateInsights} 
                      disabled={insightsLoading || loading || analyticsSummary.averagePower === null || !genAI} 
                      startIcon={insightsLoading ? <CircularProgress size={20} color="inherit"/> : null}>
                {insightsLoading ? "Generating..." : "Generate Insights"}
              </Button>
            </Box>
            <Box sx={{ minHeight: '100px', position: 'relative' }}>
              {insightsLoading && ( <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}><CircularProgress /><Typography sx={{ ml: 1 }}>Generating AI insights...</Typography></Box> )}
              {insightsError && !insightsLoading && ( <Alert severity="error" sx={{ my: 2 }}>{insightsError}</Alert> )}
              {generatedInsights && !insightsLoading && !insightsError && (
                <Box sx={{ mt: 2, '& h1, & h2, & h3, & h4, & h5, & h6': { my: 1 }, '& p': { my: 0.5 }, '& ul, & ol': { pl: 2.5 } }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedInsights}</ReactMarkdown>
                </Box>
              )}
              {!generatedInsights && !insightsLoading && !insightsError && (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', my: 2, fontStyle: 'italic' }}>
                      {genAI ? 
                         (analyticsSummary.averagePower === null ? 'Load analytics data first.' : 
                         'Click "Generate Insights" to get AI analysis based on the current view.'
                        ) : 
                       'AI Client initialization failed. Check API Key.'}
                  </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
    </> 
  );
};

export default DeviceAnalytics;