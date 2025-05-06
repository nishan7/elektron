import React, { useState, useEffect, useRef } from 'react';
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
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Stack,
} from '@mui/material';
import {
  SmartToy as SmartToyIcon,
  AccountCircle as UserIcon,
} from '@mui/icons-material';
import axios from 'axios';
import config from '../config';
import { extractDeviceId, getActiveDevices } from '../utils/deviceUtils';

// Components
import DeviceStatus from '../components/DeviceStatus';
import RecentAlerts from '../components/RecentAlerts';
import StatCard from '../components/StatCard';
import LivePowerChart from '../components/LivePowerChart';

function Dashboard() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [devices, setDevices] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    totalDevices: 0,
    activeDevices: 0,
    totalPower: 0,
    recentAlerts: [],
    powerReadings: [],
  });
  const [liveData, setLiveData] = useState({});
  const [realTimeTotalPower, setRealTimeTotalPower] = useState(0);

  // --- State for AI Chat Dialog ---
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { sender: 'ai', text: 'Hello! How can I assist you today?' },
    { sender: 'ai', text: 'Note: Configure LLM_API_KEY and LLM_API_ENDPOINT in backend environment for real AI responses.' }
  ]);
  const chatHistoryEndRef = useRef(null);

  // --- AI Chat Handlers ---
  const handleChatOpen = () => setChatOpen(true);
  const handleChatClose = () => setChatOpen(false);

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { sender: 'user', text: chatInput };
    const currentHistory = [...chatHistory, userMessage];
    
    setChatHistory(currentHistory);
    setChatInput('');
    
    // Prepare messages for the backend API
    const messagesForApi = currentHistory
        .filter(msg => msg.text !== 'Thinking...' && msg.text !== 'Note: Configure LLM_API_KEY and LLM_API_ENDPOINT in backend environment for real AI responses.')
        .map(msg => ({ role: msg.sender === 'ai' ? 'assistant' : 'user', content: msg.text }));
        
    // Add thinking indicator immediately
    setChatHistory(prev => [...prev, { sender: 'ai', text: 'Thinking...' }]); 

    try {
        const response = await axios.post(`${config.apiUrl}/api/ai/chat`, {
            messages: messagesForApi,
        });

        const aiResponse = response.data;

        // Replace "Thinking..." with the actual AI response
        setChatHistory(prev => {
            const newHistory = [...prev];
            const thinkingIndex = newHistory.findIndex(msg => msg.sender === 'ai' && msg.text === 'Thinking...');
            if (thinkingIndex !== -1) {
                newHistory[thinkingIndex] = { sender: 'ai', text: aiResponse.content };
            } else {
                // Fallback if "Thinking..." somehow disappeared
                newHistory.push({ sender: 'ai', text: aiResponse.content });
            }
            return newHistory;
        });

    } catch (error) {
        console.error("Error calling AI chat API:", error);
        const errorMessage = error.response?.data?.detail || error.message || "Failed to get response from AI.";
        // Replace "Thinking..." with an error message
        setChatHistory(prev => {
            const newHistory = [...prev];
            const thinkingIndex = newHistory.findIndex(msg => msg.sender === 'ai' && msg.text === 'Thinking...');
            if (thinkingIndex !== -1) {
                newHistory[thinkingIndex] = { sender: 'ai', text: `Error: ${errorMessage}` };
            } else {
                 newHistory.push({ sender: 'ai', text: `Error: ${errorMessage}` });
            }
            return newHistory;
        });
    }
  };

  // Scroll chat to bottom when new messages are added
  useEffect(() => {
    chatHistoryEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Fetch real-time power data
  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        // Get real-time data file with cache busting
        const timestamp = new Date().getTime();
        const response = await fetch(`/live_data.json?nocache=${timestamp}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            console.log('Live data file not found, it may not have been created yet');
            return;
          }
          throw new Error(`Failed to get real-time data: ${response.statusText}`);
        }
        
        const liveData = await response.json();
        console.log('Dashboard retrieved real-time data:', liveData);
        
        // Calculate total power from all devices' latest readings
        let totalPower = 0;
        
        Object.keys(liveData).forEach(deviceId => {
          const deviceReadings = liveData[deviceId];
          if (deviceReadings && deviceReadings.length > 0) {
            // Get the most recent reading
            const latestReading = deviceReadings[deviceReadings.length - 1];
            totalPower += latestReading.power;
          }
        });
        
        // Use new object references to force re-renders
        setLiveData({...liveData});
        setRealTimeTotalPower(Number(totalPower.toFixed(2)));
      } catch (error) {
        console.error('Error loading real-time power data:', error);
      }
    };
    
    // Initial load
    fetchLiveData();
    
    // Set timed refresh - update more frequently for better real-time display
    const intervalId = setInterval(fetchLiveData, 30000); // Refresh every 3 seconds
    
    // Clean up when component unmounts
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async (isInitialCall = false) => {
      try {
        if (isInitialCall) {
          setIsInitialLoading(true);
        }
        // Fetch devices
        const devicesResponse = await axios.get(`${config.apiUrl}/api/device`);
        const devicesList = devicesResponse.data;
        setDevices(devicesList);
        console.log('Devices:', devicesList);
        const activeDevices = getActiveDevices(devicesList);
        
        // Fetch power readings for each device
        const endTime = new Date();
        const startTime = new Date(endTime - 24 * 60 * 60 * 1000);
        
        const powerReadingsPromises = activeDevices.map(device => {
          const deviceId = extractDeviceId(device);
          console.log(`Fetching power data for device ${deviceId} in dashboard`);
          
          return axios.get(`${config.apiUrl}/api/records/data`, {
            params: {
              device_id: deviceId,
              start_time: startTime.toISOString(),
              end_time: endTime.toISOString(),
            },
          });
        });
        
        try {
          const powerReadingsResponses = await Promise.all(powerReadingsPromises);
          const allPowerReadings = powerReadingsResponses.flatMap(response => response.data || []);
          console.log('All power readings:', allPowerReadings);
          
          setDashboardData({
            totalDevices: devicesList.length,
            activeDevices: activeDevices.length,
            totalPower: allPowerReadings.reduce((sum, reading) => sum + reading.power, 0),
            powerReadings: allPowerReadings,
          });
        } catch (err) {
          console.error('Error fetching power readings:', err);
          // Continue with what we have
          setDashboardData({
            totalDevices: devicesList.length,
            activeDevices: activeDevices.length,
            totalPower: 0,
            powerReadings: [],
          });
        }
        
        if (isInitialCall) {
          setIsInitialLoading(false);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
        if (isInitialCall) {
          setIsInitialLoading(false);
        }
      }
    };

    fetchDashboardData(true);
    const interval = setInterval(() => fetchDashboardData(false), 60000);
    
    return () => clearInterval(interval);
  }, []);

  const handleDeviceChange = (deviceId) => {
    console.log('Device changed in Dashboard:', deviceId);
    setSelectedDevice(deviceId);
  };

  if (isInitialLoading) {
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
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>
            Dashboard
          </Typography>
        </Grid>
        
        <Grid item xs={12} md={7}>
          <DeviceStatus />
        </Grid>
        
        <Grid item xs={12} md={5}>
          <RecentAlerts />
        </Grid>
        
        <Grid item xs={12}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <StatCard 
                title="Total Devices" 
                value={dashboardData.totalDevices} 
                icon="devices"
                color="#4caf50"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard 
                title="Active Devices" 
                value={dashboardData.activeDevices} 
                icon="power"
                color="#2196f3"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard 
                title="Total Power Consumption" 
                value={`${Math.round(realTimeTotalPower)} W`} 
                icon="bolt"
                color="#f44336"
              />
            </Grid>
          </Grid>
        </Grid>
        
        <Grid item xs={12}>
          <LivePowerChart />
        </Grid>
      </Grid>

      {/* Floating AI Button */}
      <Fab 
        color="primary" 
        aria-label="ai-assistant" 
        onClick={handleChatOpen}
        sx={{
          position: 'fixed',
          bottom: (theme) => theme.spacing(3),
          right: (theme) => theme.spacing(3),
        }}
      >
        <SmartToyIcon />
      </Fab>

      {/* AI Chat Dialog */}
      <Dialog 
        open={chatOpen} 
        onClose={handleChatClose} 
        fullWidth 
        maxWidth="sm"
        PaperProps={{
          sx: {
            height: '70vh', // Make dialog taller
          }
        }}
      >
        <DialogTitle>AI Assistant (Simulated)</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', p: 0 }}>
           <List sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
             {chatHistory.map((msg, index) => (
               <ListItem key={index} sx={{ py: 0.5, display: 'flex', flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row' }}>
                 <Avatar sx={{ bgcolor: msg.sender === 'ai' ? 'primary.main' : 'secondary.main', width: 32, height: 32, ml: msg.sender === 'user' ? 1 : 0, mr: msg.sender === 'ai' ? 1 : 0 }}>
                   {msg.sender === 'ai' ? <SmartToyIcon fontSize="small" /> : <UserIcon fontSize="small" />}
                 </Avatar>
                 <Paper 
                   elevation={1} 
                   sx={{ 
                     p: 1, 
                     borderRadius: '10px', 
                     bgcolor: msg.sender === 'ai' ? 'grey.100' : 'primary.light',
                     color: msg.sender === 'ai' ? 'black' : 'primary.contrastText',
                     maxWidth: '80%'
                   }}
                 >
                   <ListItemText primary={msg.text} primaryTypographyProps={{ variant: 'body2', sx: { whiteSpace: 'pre-wrap' } }} />
                 </Paper>
               </ListItem>
             ))}
             <div ref={chatHistoryEndRef} /> {/* Invisible element to scroll to */}
           </List>
           <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
             <Stack direction="row" spacing={1}>
               <TextField
                 fullWidth
                 size="small"
                 variant="outlined"
                 placeholder="Type your message..."
                 value={chatInput}
                 onChange={(e) => setChatInput(e.target.value)}
                 onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
               />
               <Button variant="contained" onClick={handleChatSend}>Send</Button>
             </Stack>
           </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default Dashboard; 