import React, { useEffect, useState } from 'react';
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

const LoadDistribution = () => {
  const [loadData, setLoadData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/record/last-month-summary');
        const data = await response.json();
        setLoadData(data);
      } catch (error) {
        console.error("Failed to fetch load distribution data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Load Distribution
        </Typography>

        {loadData.length > 0 && (
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
                  formatter={(value) => [`${value}W`, 'Load']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        )}

        {loadData.length > 0 && (
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
                    {item.name}: {item.value}W
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default LoadDistribution; 