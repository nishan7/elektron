import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

// Sample data for load distribution
const loadData = [
  { name: 'HVAC', value: 40, color: '#8884d8' },
  { name: 'Lighting', value: 25, color: '#82ca9d' },
  { name: 'Equipment', value: 20, color: '#ffc658' },
  { name: 'Appliances', value: 15, color: '#ff8042' },
];

const LoadDistribution = () => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Load Distribution
        </Typography>
        
        <Box height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={loadData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {loadData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value}%`, 'Load']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          {loadData.map((item) => (
            <Grid item xs={6} key={item.name}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    backgroundColor: item.color,
                    borderRadius: '50%'
                  }}
                />
                <Typography variant="body2">
                  {item.name}: {item.value}%
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default LoadDistribution; 