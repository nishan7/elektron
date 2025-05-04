import React, { useState } from 'react';
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
import PowerConsumptionChart from '../components/PowerConsumptionChart';
import AlertsList from '../components/AlertsList';

// Sample data
const sampleDevices = [
  { id: '1', name: 'Main Panel', type: 'panel', status: 'active', health: 'good' },
  { id: '2', name: 'HVAC System', type: 'hvac', status: 'active', health: 'warning' },
  { id: '3', name: 'Lighting Circuit', type: 'lighting', status: 'active', health: 'good' },
  { id: '4', name: 'Kitchen Appliances', type: 'appliance', status: 'active', health: 'good' },
  { id: '5', name: 'Office Equipment', type: 'equipment', status: 'active', health: 'critical' },
];

const sampleAlerts = [
  {
    id: '1',
    deviceId: '2',
    deviceName: 'HVAC System',
    type: 'warning',
    message: 'High temperature detected in server room',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
  },
  {
    id: '2',
    deviceId: '5',
    deviceName: 'Office Equipment',
    type: 'critical',
    message: 'Power consumption exceeded threshold',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
  },
  {
    id: '3',
    deviceId: '1',
    deviceName: 'Main Panel',
    type: 'info',
    message: 'System check completed successfully',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
  },
  {
    id: '4',
    deviceId: '3',
    deviceName: 'Lighting Circuit',
    type: 'warning',
    message: 'Unusual power consumption pattern detected',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
  },
  {
    id: '5',
    deviceId: '4',
    deviceName: 'Kitchen Appliances',
    type: 'info',
    message: 'Regular maintenance check completed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
  },
  {
    id: '6',
    deviceId: '2',
    deviceName: 'HVAC System',
    type: 'critical',
    message: 'Temperature control system malfunction',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hours ago
  },
];


function Dashboard() {
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [devices] = useState(sampleDevices);
  const [dashboardData] = useState({
    totalDevices: sampleDevices.length,
    activeDevices: sampleDevices.filter(device => device.status === 'active').length,
    totalPower: 2500, // Sample total power in watts
    recentAlerts: sampleAlerts,
  });

  const handleDeviceChange = (deviceId) => {
    setSelectedDevice(deviceId);
  };

  if (!devices || devices.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No devices available. Please add some devices to view the dashboard.
      </Alert>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <PowerConsumptionChart selectedDevice={selectedDevice} onDeviceChange={handleDeviceChange} />
        </Grid>
        <Grid item xs={12} md={4}>
          <DeviceStatus devices={devices} />
        </Grid>
        <Grid item xs={12}>
          <AlertsList alerts={dashboardData.recentAlerts} />
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard; 