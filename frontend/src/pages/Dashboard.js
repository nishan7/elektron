import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Alert,
} from '@mui/material';

// Components
import DeviceStatus from '../components/DeviceStatus';
import PowerAnalysisChart from '../components/PowerAnalysisChart';
import AlertsList from '../components/AlertsList';
import API from '../API';

// Remove sample data or keep as fallback if needed
// const sampleDevices = [ ... ];
// const sampleAlerts = [ ... ];

function Dashboard() {
  // Device state
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [deviceError, setDeviceError] = useState(null);

  // Alert state
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true); // Added loading state for alerts
  const [alertError, setAlertError] = useState(null); // Added error state for alerts
  
  // useCallback for fetching devices, so it can be called independently
  const fetchDevices = useCallback(async (isMountedRef) => {
    setLoadingDevices(true);
    setDeviceError(null);
    try {
      const deviceResponse = await API.get('/api/device');
      if (isMountedRef.current) { 
        console.log("[Dashboard] fetchDevices: About to setDevices. Data:", deviceResponse.data); // DEBUG
        setDevices(deviceResponse.data || []);
      }
    } catch (err) {
      console.error("[Dashboard] Failed to fetch device data:", err);
      if (isMountedRef.current) {
        setDeviceError(err.response?.data?.detail || 'Could not load device data.');
        setDevices([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingDevices(false);
      }
    }
  }, []); // Empty dependency array: function identity is stable

  // useCallback for fetching alerts
  const fetchAlerts = useCallback(async (isMountedRef) => {
    setLoadingAlerts(true);
    setAlertError(null);
    try {
      const alertResponse = await API.get('/api/alert');
      if (isMountedRef.current) {
        console.log("[Dashboard] fetchAlerts: About to setAlerts. Data:", alertResponse.data); // DEBUG
        setAlerts(alertResponse.data || []);
      }
    } catch (err) {
      console.error("[Dashboard] Failed to fetch alert data:", err);
      if (isMountedRef.current) {
        setAlertError(err.response?.data?.detail || 'Could not load alert data.');
        setAlerts([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingAlerts(false);
      }
    }
  }, []); // Empty dependency array

  useEffect(() => {
    const isMountedRef = { current: true }; 
    console.log("[Dashboard] useEffect: Initial data fetch commencing."); // DEBUG
    fetchDevices(isMountedRef);
    fetchAlerts(isMountedRef);
    
    return () => { 
      console.log("[Dashboard] useEffect: Cleanup - component unmounting."); // DEBUG
      isMountedRef.current = false; 
    };
  }, [fetchDevices, fetchAlerts]); // Add fetchDevices and fetchAlerts as dependencies

  // Function to pass to AlertsList for updating alerts state after resolving
  // This function will be given to the onAlertsChange prop of AlertsList
  const handleAlertsStateChange = (updateFunction) => {
    setAlerts(updateFunction); 
    const isMountedRef = { current: true }; 
    console.log("[Dashboard] handleAlertsStateChange: Calling fetchDevices to refresh device status."); // DEBUG
    fetchDevices(isMountedRef)
      .then(() => console.log("[Dashboard] handleAlertsStateChange: fetchDevices call completed.")) // DEBUG
      .catch(err => console.error("[Dashboard] handleAlertsStateChange: fetchDevices call failed.", err)) // DEBUG
      .finally(() => {
        isMountedRef.current = false; 
      });
  };

  // Combined Loading State Check
  if (loadingDevices || loadingAlerts) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  // Display error if devices OR alerts failed to load
  if (deviceError || alertError) {
    return (
      <Box sx={{ p: 2 }}>
        {deviceError && <Alert severity="error" sx={{ mb: 2 }}>{deviceError}</Alert>}
        {alertError && <Alert severity="error" sx={{ mb: 2 }}>{alertError}</Alert>}
        {/* Optionally show other parts of dashboard if only one fails? */}
      </Box>
    );
  }
  
  // Handle case where there are no devices (important for DeviceStatus)
  if (!loadingDevices && devices.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No devices found. Please add devices via the Manage Devices page.
      </Alert>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <PowerAnalysisChart 
            selectedDevice="all" 
            selectedTimeRange="24h"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <DeviceStatus devices={devices} />
        </Grid>
        <Grid item xs={12}>
          {/* Pass fetched alerts to AlertsList */}
          <AlertsList alerts={alerts} onAlertsChange={handleAlertsStateChange} />
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard; 