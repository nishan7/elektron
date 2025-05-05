import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  TaskAlt as ResolveIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import config from '../config';
import { format } from 'date-fns';

function AlertsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [devices, setDevices] = useState([]);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    severity: 'all',
    resolved: false,
  });
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [filters, paginationModel]);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        resolved: filters.resolved,
        limit: 100,
      };
      
      const response = await axios.get(`${config.apiUrl}/api/alerts`, { params });

      const alertsWithDeviceNames = response.data.map(alert => {
        const device = devices.find(d => d._id === alert.device_id);
        return {
          ...alert,
          id: alert._id,
          deviceName: device ? device.name : 'Unknown Device',
        };
      });

      setAlerts(alertsWithDeviceNames);

    } catch (error) {
      console.error('Error fetching alerts:', error);
      if (error.response && error.response.status === 404) {
        setError('Failed to fetch alerts: API endpoint not found. Please ensure the backend API is implemented and running.');
      } else {
        setError(`Failed to fetch alerts: ${error.message}`);
      }
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDevices = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/device/`);
      setDevices(response.data);
    } catch (err) {
      console.error('Failed to load devices:', err);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setFilters({
      ...filters,
      resolved: newValue === 1,
    });
    setPaginationModel({ ...paginationModel, page: 0 });
  };

  const handleResolveAlert = async (alertId) => {
    setError(null);
    try {
      await axios.put(`${config.apiUrl}/api/alerts/${alertId}/resolve/`);
      fetchAlerts();
    } catch (err) {
      console.error('Failed to resolve alert:', err);
      setError(`Failed to resolve alert: ${err.response?.data?.detail || err.message}`);
    }
  };

  const renderSeverityChip = (params) => {
    const severity = params.value.toLowerCase();
    let color = 'default';
    if (severity === 'critical') color = 'error';
    else if (severity === 'warning') color = 'warning';
    else if (severity === 'info') color = 'info';
    
    return <Chip label={params.value} color={color} size="small" />;
  };

  const columns = [
    {
      field: 'timestamp',
      headerName: 'Timestamp',
      width: 180,
      valueFormatter: (params) => 
        format(new Date(params.value), 'yyyy-MM-dd HH:mm:ss')
    },
    {
      field: 'deviceName',
      headerName: 'Device Name',
      width: 180,
    },
    {
      field: 'severity',
      headerName: 'Severity',
      width: 120,
      renderCell: renderSeverityChip,
    },
    {
      field: 'message',
      headerName: 'Message',
      flex: 1,
      minWidth: 250,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        if (!filters.resolved) {
          return (
            <Button
              variant="outlined"
              size="small"
              startIcon={<ResolveIcon />}
              onClick={() => handleResolveAlert(params.row.id)}
            >
              Resolve
            </Button>
          );
        }
        return null;
      },
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh - 64px - 48px)', width: '100%' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Alerts
      </Typography>

      <Paper sx={{ height: 'calc(100% - 72px)', width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Active Alerts" />
          <Tab label="Resolved Alerts" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        <DataGrid
          rows={alerts}
          columns={columns}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[5, 10, 25]}
          checkboxSelection={false}
          disableRowSelectionOnClick
          sx={{ 
             border: 0,
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-columnHeader:focus': {
              outline: 'none',
            },
          }}
        />
      </Paper>
    </Box>
  );
}

export default AlertsPage; 