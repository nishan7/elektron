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

// NEW: Helper function to determine device display health
const calculateDeviceDisplayHealth = (device, allAlerts) => {
  if (!device || !allAlerts) {
    return 'unknown'; // Should not happen if data is loaded
  }

  const deviceAlerts = allAlerts.filter(alert => alert.device_id === device._id);

  if (deviceAlerts.length === 0) {
    return 'good'; // No alerts, device is healthy
  }

  const unresolvedAlerts = deviceAlerts.filter(alert => !alert.resolved);

  if (unresolvedAlerts.length === 0) {
    return 'good'; // All alerts resolved, device is healthy
  }

  // Determine the most severe unresolved alert type
  // Severity order: critical > warning > info (or others)
  // DeviceStatus.js expects 'critical', 'warning', 'good'
  if (unresolvedAlerts.some(alert => alert.type === 'critical')) {
    return 'critical';
  }
  if (unresolvedAlerts.some(alert => alert.type === 'warning')) {
    return 'warning';
  }
  // If there are unresolved alerts but none are critical or warning,
  // we can decide how to classify. Let's treat any other unresolved as 'warning' for now.
  // Or, if only 'info' type exists and is unresolved, we could map it to 'warning' or a new category.
  // For simplicity with existing DeviceStatus component, let's default to 'warning' if any unresolved exist.
  return 'warning'; // Default for any other unresolved alerts
};

function Dashboard() {
  // Device state
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [deviceError, setDeviceError] = useState(null);

  // Alert state
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [alertError, setAlertError] = useState(null);

  // Settings state - Initialize with nested structure and null/defaults
  const [settings, setSettings] = useState({ 
    notifications: { email: true, sms: false, criticalAlerts: true }, // Can keep defaults here
    thresholds: { powerAlert: null, costAlert: null, criticalThreshold: null, dataRefreshInterval: 30, timeZone: 'UTC' } 
  });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settingsError, setSettingsError] = useState(null);


  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch devices
        const devicesResponse = await axios.get(`${config.apiUrl}/api/device`);
        setDevices(devicesResponse.data);
        console.log('Devices:', devicesResponse.data);
        const activeDevices = devicesResponse.data.filter(device => device.is_active);
        
        // Fetch power readings for each device
        const endTime = new Date();
        const startTime = new Date(endTime - 24 * 60 * 60 * 1000);
        
        const powerReadingsPromises = activeDevices.map(device =>
          axios.get(`${config.apiUrl}/api/record/data/?device_id=${device._id}`, {
            params: {
              start_time: startTime.toISOString(),
              end_time: endTime.toISOString(),
            },
          })
        );
        
        const powerReadingsResponses = await Promise.all(powerReadingsPromises);
        const allPowerReadings = powerReadingsResponses.flatMap(response => response.data);
        
        // Fetch alerts for each device
        // const alertsPromises = activeDevices.map(device =>
        //   axios.get(`${config.apiUrl}/api/alerts/${device._id}`, {
        //     params: { resolved: false, limit: 5 }
        //   })
        // );
        
        // const alertsResponses = await Promise.all(alertsPromises);
        // const allAlerts = alertsResponses.flatMap(response => response.data);
        
        // // Sort alerts by timestamp
        // const sortedAlerts = allAlerts.sort((a, b) => 
        //   new Date(b.timestamp) - new Date(a.timestamp)
        // );
        
        setDashboardData({
          totalDevices: devicesResponse.data.length,
          activeDevices: activeDevices.length,
          totalPower: allPowerReadings.reduce((sum, reading) => sum + reading.power, 0),
          // recentAlerts: sortedAlerts.slice(0, 5),
          powerReadings: allPowerReadings,
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
        setLoading(false);
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

  // useCallback for fetching settings
  const fetchSettings = useCallback(async (isMountedRef) => {
    setLoadingSettings(true);
    setSettingsError(null);
    try {
      const settingsResponse = await API.get('/api/settings');
      const fetchedSettings = settingsResponse?.data;
      
      if (isMountedRef.current) {
        console.log("[Dashboard] fetchSettings: Fetched settings:", fetchedSettings);
        // Use functional update form of setSettings to avoid needing 'settings' in dependency array
        setSettings(prevState => ({
          notifications: fetchedSettings?.notifications || prevState.notifications, // Fallback to previous state
          thresholds: fetchedSettings?.thresholds || prevState.thresholds       // Fallback to previous state
        }));
      }
    } catch (err) {
      console.error("[Dashboard] Failed to fetch settings data:", err);
      if (isMountedRef.current) {
        setSettingsError(err.response?.data?.detail || 'Could not load settings data.');
        // Optionally reset to default structure on error, or keep existing state
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingSettings(false);
      }
    }
  // Remove settings from dependency array to prevent loop
  // This function's identity will now be stable.
  }, []); 

  useEffect(() => {
    const isMountedRef = { current: true }; 
    console.log("[Dashboard] useEffect: Initial data fetch commencing (including settings).");
    fetchDevices(isMountedRef);
    fetchAlerts(isMountedRef);
    fetchSettings(isMountedRef); // Call the stable function
    
    return () => { 
      console.log("[Dashboard] useEffect: Cleanup - component unmounting.");
      isMountedRef.current = false; 
    };
  }, [fetchDevices, fetchAlerts, fetchSettings]); // Dependencies are stable now

  // ADD useEffect to log settings state changes
  useEffect(() => {
    console.log("[Dashboard] Settings state updated:", JSON.parse(JSON.stringify(settings)));
  }, [settings]);

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
  if (loadingDevices || loadingAlerts || loadingSettings) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  // Display error if devices OR alerts OR settings failed to load
  if (deviceError || alertError || settingsError) {
    return (
      <Box sx={{ p: 2 }}>
        {deviceError && <Alert severity="error" sx={{ mb: 2 }}>{deviceError}</Alert>}
        {alertError && <Alert severity="error" sx={{ mb: 2 }}>{alertError}</Alert>}
        {settingsError && <Alert severity="error" sx={{ mb: 2 }}>{settingsError}</Alert>}
      </Box>
    );
  }
  
  // Handle case where there are no devices (important for DeviceStatus)
  if (!loadingDevices && devices.length === 0 && !deviceError) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No devices found. Please add devices via the Manage Devices page.
      </Alert>
    );
  }

  // NEW: Prepare devices with calculated health status before rendering
  const devicesWithCalculatedHealth = devices.map(device => ({
    ...device,
    calculatedHealth: calculateDeviceDisplayHealth(device, alerts)
  }));

  // Log values just before rendering
  console.log("[Dashboard] Rendering. Current settings for chart:",
      settings?.thresholds?.powerAlert,
      settings?.thresholds?.costAlert
  );

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {/* Pass correct nested values, use optional chaining for safety */}
          <PowerAnalysisChart 
            selectedDevice="all" 
            selectedTimeRange="24h"
            powerThreshold={settings?.thresholds?.powerAlert} 
            costThreshold={settings?.thresholds?.costAlert}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          {/* MODIFIED: Pass devicesWithCalculatedHealth to DeviceStatus */}
          <DeviceStatus devices={devicesWithCalculatedHealth} />
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