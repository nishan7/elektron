import axios from 'axios';

// Create a pre-configured Axios instance
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://18.215.147.51/api',
});


export default API;
