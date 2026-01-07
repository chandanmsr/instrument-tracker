// src/config/environment.js

const environment = {
  // Development environment
  development: {
    baseUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:3000',
    isProduction: false
  },
  
  // Production environment (update with your actual Render URL)
  production: {
    baseUrl: 'https://your-app-name.onrender.com', // ← UPDATE THIS
    apiUrl: 'https://your-app-name.onrender.com',  // ← UPDATE THIS
    isProduction: true
  }
};

// Get current environment based on NODE_ENV
const getCurrentEnvironment = () => {
  const env = process.env.NODE_ENV || 'development';
  return environment[env];
};

// Get base URL
export const getBaseUrl = () => {
  return getCurrentEnvironment().baseUrl;
};

// Get instrument URL
export const getInstrumentUrl = (instrumentId) => {
  return `${getBaseUrl()}/instrument/${instrumentId}`;
};

// Check if production
export const isProduction = () => {
  return getCurrentEnvironment().isProduction;
};

export default getCurrentEnvironment();