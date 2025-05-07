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

const DeviceAnalytics = () => {
  const [loading, setLoading] = useState(true);
  // States to hold fetched/real data (replace sample generation)
  const [displayData, setDisplayData] = useState({ // Renamed for clarity
    currentConsumption: 0, hourlyData: [], trendData: []
  });
  const [displayMetrics, setDisplayMetrics] = useState({ // Renamed for clarity
     costSavings: 0, efficiency: 0, carbonReduction: 0, roi: 0
  });

  // State for filters
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');

  // --- State for data specifically formatted for the AI Prompt ---
  // IMPORTANT: This needs to be populated by your REAL data fetching logic
  const [powerDetailsForPrompt, setPowerDetailsForPrompt] = useState({
    averageW: null, peakW: null, peakHours: [], trendVsPeriod: null
  });
  const [deviceTypeForPrompt, setDeviceTypeForPrompt] = useState('');
  const [sustainabilityScore, setSustainabilityScore] = useState(null); // Use the relevant metric
  // --- End AI Prompt Data State ---

  const [generatedInsights, setGeneratedInsights] = useState('');
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState(null);

  const devices = [ { id: 'all', name: 'All Devices' }, { id: '1', name: 'HVAC Unit 1', type: 'HVAC' }, { id: '2', name: 'Lighting Panel A', type: 'Lighting' }, { id: '3', name: 'Server Room', type: 'IT Equipment' }, { id: '4', name: 'Main Distribution', type: 'Panel'}];

  const genAI = useMemo(() => {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (!apiKey) { console.error("API Key not found."); setInsightsError("API Key is missing."); return null; }
    try { return new GoogleGenerativeAI(apiKey); }
    catch (error) { console.error("Error initializing GoogleGenerativeAI:", error); setInsightsError("Failed to initialize AI Client."); return null; }
  }, []);

  useEffect(() => {
    setLoading(true);
    // *** START: Replace this with your ACTUAL data fetching ***
    // This function should fetch data based on selectedDevice and timeRange
    // and then call setDisplayData, setDisplayMetrics, AND set the prompt-specific states below
    const fetchAndSetData = async () => {
      // Example: pretend fetch
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

      const deviceDetails = devices.find(d => d.id === selectedDevice);
      const currentDeviceName = deviceDetails?.name || 'Selected Device'; // Use for display title if needed
      const currentDeviceType = deviceDetails?.type || 'Unknown'; // Crucial for prompt

      // --- Generate Sample Data (Replace with real fetched values) ---
      const avg = Math.random() * 500 + 100;
      const peak = avg + Math.random() * 500;
      const efficiency = Math.floor(70 + Math.random() * 30);
      const carbon = Math.floor(Math.random() * 100);
      const sampleHourly = Array.from({ length: 24 }, (_, i) => ({ hour: i, consumption: Math.random() * avg * 2 }));
      const sampleTrend = Array.from({ length: 7 }, (_, i) => ({ date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(), consumption: avg * (1 + Math.random() * 0.2 - 0.1) }));
      const samplePeakHours = sampleHourly.sort((a, b) => b.consumption - a.consumption).slice(0, 3).map(h => h.hour).sort((a, b) => a - b);
      const sampleTrendPerc = (Math.random() > 0.5 ? '+' : '-') + (Math.random() * 15).toFixed(1) + '%';
      // --- End Sample Data Generation ---

      // Set data for UI display
      setDisplayData({ currentConsumption: avg, hourlyData: sampleHourly, trendData: sampleTrend });
      setDisplayMetrics({ costSavings: Math.floor(Math.random() * 200), efficiency: efficiency, carbonReduction: carbon, roi: Math.floor(Math.random() * 50) });

      // Set data specifically formatted for the AI prompt
      setPowerDetailsForPrompt({
          averageW: avg,
          peakW: peak,
          peakHours: samplePeakHours, // e.g., [14, 15, 16]
          trendVsPeriod: sampleTrendPerc // e.g., "+10%"
      });
      setDeviceTypeForPrompt(currentDeviceType); // e.g., "HVAC"
      setSustainabilityScore(carbon); // Use the relevant metric value

      setLoading(false);
      setGeneratedInsights(''); // Clear insights on data refresh
      setInsightsError(null);
    };
    // *** END: Replace above with your ACTUAL data fetching ***

    fetchAndSetData();

  }, [selectedDevice, timeRange]);

  const handleGenerateInsights = async () => {
    if (!genAI) { setInsightsError("AI Client not initialized."); return; }
    // Check if the prompt-specific data is ready
    if (!powerDetailsForPrompt.averageW || !deviceTypeForPrompt) {
        setInsightsError("Detailed device data not available for analysis.");
        return;
    }

    setInsightsLoading(true);
    setGeneratedInsights('');
    setInsightsError(null);

    // --- ** REFINED PROMPT FOR SPECIFICITY ** ---
    const prompt = `
      Analyze the following power usage data for a device identified as type "${deviceTypeForPrompt}":
      - Average Consumption: ${formatPower(powerDetailsForPrompt.averageW, { decimalPlaces: 1 })}
      - Peak Consumption: ${formatPower(powerDetailsForPrompt.peakW, { decimalPlaces: 1 })}
      - Peak Usage Hours: ${powerDetailsForPrompt.peakHours?.join(', ')}:00
      - Recent Trend: ${powerDetailsForPrompt.trendVsPeriod || 'N/A'}
      - Current Sustainability Score: ${sustainabilityScore}%

      Provide specific and actionable business insights based *directly* on these numbers and the device type. Be concise (1-2 bullet points per category).

      Format using Markdown:
      **Cost Optimization Opportunities**
      * [Specific action based on data/device type, mentioning relevant numbers like peak W or peak hours. Estimate savings if possible.]
      * [Another specific action...]

      **Sustainability Impact**
      * [Specific action related to the device type and sustainability score. Mention the score.]
      * [Another specific action...]

      Do not add introductory or concluding sentences.
    `;
    // --- ** END OF REFINED PROMPT ** ---

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      setGeneratedInsights(text);
    } catch (error) {
      console.error("Error generating insights:", error);
      setInsightsError(`Failed to generate insights. Error: ${error.message || 'Unknown error'}`);
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleDeviceChange = (event) => setSelectedDevice(event.target.value);
  const handleTimeRangeChange = (range) => setTimeRange(range);
  const handleExport = () => console.log('Exporting data...');

  if (loading) {
    return ( <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}><CircularProgress /></Box> );
  }

  return (
    <Grid container spacing={3}>
      {/* Key Metrics Section (uses displayMetrics, displayData) */}
       <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Key Performance Metrics</Typography>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport} size="small">Export Report</Button>
            </Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
               <Grid item xs={12} sm={6} md={3}><Card variant="outlined"><CardContent><Typography variant="subtitle2" color="text.secondary" gutterBottom>Current Power (Avg)</Typography><Typography variant="h5" sx={{ mb: 1 }}>{formatPower(displayData.currentConsumption, { decimalPlaces: 1 })}</Typography></CardContent></Card></Grid>
               <Grid item xs={12} sm={6} md={3}><Card variant="outlined"><CardContent><Typography variant="subtitle2" color="text.secondary" gutterBottom>Cost Savings (Est)</Typography><Typography variant="h5" sx={{ mb: 1 }}>${displayMetrics.costSavings}</Typography></CardContent></Card></Grid>
               <Grid item xs={12} sm={6} md={3}><Card variant="outlined"><CardContent><Typography variant="subtitle2" color="text.secondary" gutterBottom>Efficiency Score</Typography><Typography variant="h5" sx={{ mb: 1 }}>{displayMetrics.efficiency}%</Typography></CardContent></Card></Grid>
               <Grid item xs={12} sm={6} md={3}><Card variant="outlined"><CardContent><Typography variant="subtitle2" color="text.secondary" gutterBottom>Sustainability Score</Typography><Typography variant="h5" sx={{ mb: 1 }}>{displayMetrics.carbonReduction}%</Typography></CardContent></Card></Grid> {/* Changed to use displayMetrics */}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Power Analytics Chart Section (uses displayData) */}
      <Grid item xs={12}>
         <Card>
           <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" mb={2} gap={2}>
               <Box><Typography variant="h6">Power Analytics</Typography><Stack direction="row" spacing={1} mt={1}><Chip label="24h" onClick={() => handleTimeRangeChange('24h')} color={timeRange === '24h' ? 'primary' : 'default'} size="small"/><Chip label="7d" onClick={() => handleTimeRangeChange('7d')} color={timeRange === '7d' ? 'primary' : 'default'} size="small"/><Chip label="30d" onClick={() => handleTimeRangeChange('30d')} color={timeRange === '30d' ? 'primary' : 'default'} size="small"/></Stack></Box>
               <FormControl sx={{ minWidth: 200 }} size="small"><InputLabel>Select Device</InputLabel><Select value={selectedDevice} label="Select Device" onChange={handleDeviceChange}>{devices.map((device) => ( <MenuItem key={device.id} value={device.id}>{device.name}</MenuItem> ))}</Select></FormControl>
            </Box>
            <Box height={300}>
               <ResponsiveContainer width="100%" height="100%">{timeRange === '24h' ? (<BarChart data={displayData.hourlyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="hour" tickFormatter={(tick) => `${tick}:00`}/><YAxis yAxisId="left" orientation="left" stroke="#8884d8" label={{ value: 'W', angle: -90, position: 'insideLeft' }}/><Tooltip /><Legend /><Bar yAxisId="left" dataKey="consumption" name="Power (W)" fill="#8884d8"/></BarChart>) : (<LineChart data={displayData.trendData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis yAxisId="left" orientation="left" stroke="#8884d8" label={{ value: 'Avg W', angle: -90, position: 'insideLeft' }}/><Tooltip /><Legend /><Line yAxisId="left" type="monotone" dataKey="consumption" name="Avg Power (W)" stroke="#8884d8" activeDot={{ r: 8 }}/></LineChart>)}</ResponsiveContainer>
            </Box>
           </CardContent>
         </Card>
      </Grid>

      {/* Insights Section - Renders Markdown from state */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Business Insights (AI Generated)
              </Typography>
              <Button variant="contained" size="small" onClick={handleGenerateInsights} disabled={insightsLoading || loading || !powerDetailsForPrompt.averageW || !genAI} startIcon={insightsLoading ? <CircularProgress size={20} color="inherit"/> : null}>
                {insightsLoading ? "Generating..." : "Generate Insights"}
              </Button>
            </Box>
            <Box sx={{ minHeight: '100px', position: 'relative' }}>
              {insightsLoading && ( <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}><CircularProgress /><Typography sx={{ ml: 1 }}>Generating AI insights...</Typography></Box> )}
              {insightsError && !insightsLoading && ( <Alert severity="error" sx={{ my: 2 }}>{insightsError}</Alert> )}
              {generatedInsights && !insightsLoading && !insightsError && (
                <Box sx={{ mt: 2, '& h1, & h2, & h3, & h4, & h5, & h6': { my: 1 }, '& p': { my: 0.5 }, '& ul, & ol': { pl: 2.5 } }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {generatedInsights}
                  </ReactMarkdown>
                </Box>
              )}
              {!generatedInsights && !insightsLoading && !insightsError && (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', my: 2, fontStyle: 'italic' }}>
                      {genAI ? 'Click "Generate Insights" to get AI analysis based on the current view.' : 'AI Client initialization failed. Check API Key.'}
                  </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default DeviceAnalytics;