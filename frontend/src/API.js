import axios from 'axios';

// Create a pre-configured Axios instance
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
});


export default API;
