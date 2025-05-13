// frontend/src/components/Layout.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  Button, // Import Button for Logout
  Stack,  // Import Stack for layout in AppBar
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  DevicesOther as DevicesIcon,
  Analytics as AnalyticsIcon,
  Notifications as AlertsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon, // Optional: Import logout icon
} from '@mui/icons-material';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Devices', icon: <DevicesIcon />, path: '/devices' },
  { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
  { text: 'Alerts', icon: <AlertsIcon />, path: '/alerts' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('currentUser'); // Clear login status from localStorage
    navigate('/login'); // Redirect to login page
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Elektron
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (mobileOpen) { // Close drawer on mobile after navigation
                  handleDrawerToggle();
                }
              }}
              sx={{ py: 1.5 }} // Adjust padding if needed
            >
              <ListItemIcon sx={{ minWidth: '40px' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      {/* Optional: Logout button at the bottom of the drawer */}
      {/* <List>
         <ListItem disablePadding>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon sx={{ minWidth: '40px' }}><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
      </List> */}
    </div>
  );

  const pageTitle = menuItems.find((item) => item.path === location.pathname)?.text || 'Electricity Monitor';

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: theme.palette.background.paper, // Match theme
          color: theme.palette.text.primary // Match theme
        }}
        elevation={1} // Adjust elevation if needed
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          {/* Use Stack to push Logout button to the right */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
             <Typography variant="h6" noWrap component="div">
                {pageTitle}
             </Typography>
             {/* Logout Button in AppBar */}
             <Button
                color="inherit"
                onClick={handleLogout}
                startIcon={<LogoutIcon />} // Optional icon
              >
                Logout
             </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` },
          marginTop: '64px', // Ensure content is below AppBar
          backgroundColor: theme.palette.background.default, // Match theme background
          minHeight: 'calc(100vh - 64px)' // Ensure content area fills height
        }}
      >
        {/* Render the page content passed as children */}
        {children}
      </Box>
    </Box>
  );
}

export default Layout;