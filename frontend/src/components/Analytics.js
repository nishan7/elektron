import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Lightbulb as LightbulbIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { config } from '../config';

function Analytics({ deviceId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trends, setTrends] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${config.apiUrl}/api/analytics/${deviceId}`);
        setAnalytics(response.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setError('Failed to fetch analytics data');
      } finally {
        setLoading(false);
      }
    };

    if (deviceId) {
      fetchAnalytics();
    }
  }, [deviceId]);

  const getTrendIcon = (slope) => {
    if (slope > 0) {
      return <TrendingUpIcon color="error" />;
    } else {
      return <TrendingDownIcon color="success" />;
    }
  };

  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'peak_usage':
        return <WarningIcon color="warning" />;
      case 'usage_variance':
        return <WarningIcon color="warning" />;
      case 'continuous_high_usage':
        return <WarningIcon color="error" />;
      default:
        return <LightbulbIcon color="info" />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
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
    <Grid container spacing={3}>
      {/* Trend Analysis */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Power Consumption Trend
          </Typography>
          
          {trends && (
            <Box>
              <Box display="flex" alignItems="center" mb={2}>
                <Box mr={1}>
                  {getTrendIcon(trends.trend_slope)}
                </Box>
                <Typography variant="subtitle1">
                  {trends.trend_slope > 0 ? 'Increasing' : 'Decreasing'} Trend
                </Typography>
              </Box>
              
              <Typography variant="body2" color="textSecondary" paragraph>
                The power consumption is {trends.trend_slope > 0 ? 'increasing' : 'decreasing'} at a rate of 
                {Math.abs(trends.trend_slope).toFixed(2)} watts per day.
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                Peak Usage Hours:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                {trends.peak_hours.map((hour, index) => (
                  <Chip 
                    key={index} 
                    label={`${hour}:00`} 
                    color="primary" 
                    variant="outlined" 
                    size="small" 
                  />
                ))}
              </Box>
              
              <Typography variant="subtitle2" gutterBottom>
                Daily Statistics:
              </Typography>
              <List dense>
                {trends.daily_stats.slice(0, 5).map((stat, index) => (
                  <ListItem key={index}>
                    <ListItemText 
                      primary={`${new Date(stat.date).toLocaleDateString()}`}
                      secondary={`Avg: ${stat.mean.toFixed(2)}W, Min: ${stat.min.toFixed(2)}W, Max: ${stat.max.toFixed(2)}W`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Paper>
      </Grid>
      
      {/* Anomalies */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Detected Anomalies
          </Typography>
          
          {anomalies.length > 0 ? (
            <List>
              {anomalies.map((anomaly, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      <WarningIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Anomaly detected at ${new Date(anomaly.timestamp).toLocaleString()}`}
                      secondary={`Power: ${anomaly.power.toFixed(2)}W, Anomaly Score: ${anomaly.anomaly_score.toFixed(2)}`}
                    />
                  </ListItem>
                  {index < anomalies.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box display="flex" alignItems="center" justifyContent="center" height="200px">
              <Typography color="textSecondary">
                No anomalies detected in the selected time period
              </Typography>
            </Box>
          )}
        </Paper>
      </Grid>
      
      {/* Recommendations */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Recommendations
          </Typography>
          
          {recommendations.length > 0 ? (
            <List>
              {recommendations.map((recommendation, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      {getRecommendationIcon(recommendation.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={recommendation.message}
                      secondary={`Potential savings: ${recommendation.potential_savings}`}
                    />
                  </ListItem>
                  {index < recommendations.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box display="flex" alignItems="center" justifyContent="center" height="100px">
              <Typography color="textSecondary">
                No recommendations available at this time
              </Typography>
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
}

export default Analytics; 