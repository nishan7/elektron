import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// The correct endpoint for fetching filtered/time-ranged data
const RECORDS_DATA_ENDPOINT = `${API_URL}/record/data`; 

// Get records using the specific /data endpoint with query parameters
export const getDeviceRecords = async (deviceId, params = {}) => {
  try {
    // Pass device_id and other params (like time range) as query parameters
    const queryParams = { ...params, device_id: deviceId };
    const response = await axios.get(RECORDS_DATA_ENDPOINT, { params: queryParams });
    return response.data;
  } catch (error) {
    console.error('Error fetching device records:', error);
    throw error;
  }
};

// Get all records using the specific /data endpoint with query parameters
export const getAllRecords = async (params = {}) => {
  try {
    const response = await axios.get(RECORDS_DATA_ENDPOINT, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching all records:', error);
    throw error;
  }
};

// Helper function to get aggregated power data for charts
export const getAggregatedPowerData = async (deviceId = null, timeRange = '7d') => {
  try {
    // Construct params for the /data endpoint
    const endTime = new Date();
    const startTime = new Date();
    const rangeDays = parseInt(timeRange?.replace('d', '')) || 7;
    startTime.setDate(endTime.getDate() - rangeDays);

    const params = {
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
    };
    if (deviceId && deviceId !== 'all') { // Handle 'all' case if needed, or fetch per device
      params.device_id = deviceId;
    }
    
    // Fetch raw data from the specific backend endpoint
    // Assuming getAllRecords now correctly points to /api/record/data
    const records = await getAllRecords(params);
    
    if (!records || records.length === 0) {
        console.log("No records found for aggregation, returning empty array.");
        return [];
    }
    
    console.log(`Fetched ${records.length} records for aggregation.`);

    // Process data for visualization
    const groupedByDay = {};
    
    records.forEach(record => {
      const date = new Date(record.timestamp);
      const day = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (!groupedByDay[day]) {
        groupedByDay[day] = {
          powers: [],
          total: 0,
          count: 0
        };
      }
      
      groupedByDay[day].powers.push(record.power);
      groupedByDay[day].total += record.power;
      groupedByDay[day].count += 1;
    });
    
    const chartData = Object.keys(groupedByDay).map(day => {
      const data = groupedByDay[day];
      const avgPower = data.count > 0 ? data.total / data.count : 0;
      const minPower = data.powers.length > 0 ? Math.min(...data.powers) : 0;
      const maxPower = data.powers.length > 0 ? Math.max(...data.powers) : 0;
      return {
        date: day,
        averagePower: parseFloat(avgPower.toFixed(2)),
        minPower: parseFloat(minPower.toFixed(2)),
        maxPower: parseFloat(maxPower.toFixed(2)),
      };
    });
    
    chartData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    console.log("Aggregated Chart Data:", chartData);
    return chartData;

  } catch (error) {
    console.error('Error fetching aggregated power data:', error);
    // Don't re-throw here, let the component handle the empty data or show an error
    return []; // Return empty array on error
  }
};

// Helper to get comparison data between devices or time periods
export const getComparisonData = async (deviceIds = [], timeRanges = ['7d']) => {
  try {
    const comparisonData = [];
    const deviceDetails = {}; // Cache device names

    // If no devices specified, get all active devices
    if (deviceIds.length === 0) {
        try {
            const devicesResponse = await axios.get(`${API_URL}/device/`);
            // Filter for active devices and map to IDs
            deviceIds = devicesResponse.data
                            // .filter(device => device.is_active) // Assuming an is_active flag
                            .map(device => device._id); 
            // Cache names
            devicesResponse.data.forEach(device => { deviceDetails[device._id] = device.name });
        } catch (deviceError) {
            console.error("Error fetching device list for comparison:", deviceError);
            return []; // Return empty if device list fails
        }
    }
    
    // Get data for each specified device
    for (const deviceId of deviceIds) {
      // Fetch device name if not cached
      if (!deviceDetails[deviceId]) {
          try {
              const deviceResponse = await axios.get(`${API_URL}/device/${deviceId}`);
              deviceDetails[deviceId] = deviceResponse.data.name;
          } catch (detailError) {
              console.warn(`Failed to get details for device ${deviceId}:`, detailError);
              deviceDetails[deviceId] = `Device ${deviceId.slice(-6)}`; // Fallback name
          }
      }

      for (const timeRange of timeRanges) {
        const endTime = new Date();
        const startTime = new Date();
        const rangeDays = parseInt(timeRange?.replace('d', '')) || 7;
        startTime.setDate(endTime.getDate() - rangeDays);

        const params = {
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            device_id: deviceId
        };

        try {
            const records = await getAllRecords(params); // Use the correct endpoint
            
            const totalPower = records.reduce((sum, record) => sum + record.power, 0);
            const avgPower = records.length > 0 ? totalPower / records.length : 0;
            
            comparisonData.push({
              deviceId,
              deviceName: deviceDetails[deviceId],
              timeRange,
              avgPower,
              recordsCount: records.length
            });
        } catch (recordError) {
            console.error(`Error fetching records for comparison (Device: ${deviceId}, Range: ${timeRange}):`, recordError);
            // Optionally add an entry indicating failure
            comparisonData.push({
              deviceId,
              deviceName: deviceDetails[deviceId],
              timeRange,
              avgPower: 0, // Indicate error/no data
              recordsCount: 0,
              error: true
            });
        }
      }
    }
    
    console.log("Comparison Data:", comparisonData);
    return comparisonData;

  } catch (error) {
    console.error('Error fetching comparison data:', error);
    // Don't re-throw, return empty array
    return []; 
  }
}; 