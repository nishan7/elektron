import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import DevicesIcon from '@mui/icons-material/Devices';
import PowerIcon from '@mui/icons-material/Power';
import BoltIcon from '@mui/icons-material/Bolt';
import BarChartIcon from '@mui/icons-material/BarChart';

function StatCard({ title, value, icon, color }) {
  const getIcon = () => {
    switch (icon) {
      case 'devices':
        return <DevicesIcon style={{ color, fontSize: 40 }} />;
      case 'power':
        return <PowerIcon style={{ color, fontSize: 40 }} />;
      case 'bolt':
        return <BoltIcon style={{ color, fontSize: 40 }} />;
      default:
        return <BarChartIcon style={{ color, fontSize: 40 }} />;
    }
  };

  return (
    <Paper
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%',
        borderLeft: `5px solid ${color}`,
      }}
    >
      <Box>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="div">
          {value}
        </Typography>
      </Box>
      <Box>
        {getIcon()}
      </Box>
    </Paper>
  );
}

export default StatCard; 