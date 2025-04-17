const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  useSampleData: process.env.REACT_APP_USE_SAMPLE_DATA === 'true',
};

export default config; 