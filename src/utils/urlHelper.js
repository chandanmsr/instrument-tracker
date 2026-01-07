// src/utils/urlHelper.js

// Determine the correct base URL for the app
export const getAppBaseUrl = () => {
  // For production, we need the actual deployed URL
  // If we have a custom domain or specific production URL, use it
  const productionUrl = process.env.REACT_APP_PRODUCTION_URL;
  
  // Use production URL if specified
  if (process.env.NODE_ENV === 'production' && productionUrl) {
    return productionUrl;
  }
  
  // Otherwise use the current origin (works for both local and production)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Fallback for server-side rendering
  return '';
};

// Generate URL for an instrument
export const getInstrumentUrl = (instrumentId) => {
  const baseUrl = getAppBaseUrl();
  return `${baseUrl}/instrument/${instrumentId}`;
};

// Check if we're in production
export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

// Get environment info for debugging
export const getEnvironmentInfo = () => {
  return {
    environment: process.env.NODE_ENV,
    baseUrl: getAppBaseUrl(),
    origin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
    protocol: typeof window !== 'undefined' ? window.location.protocol : 'N/A'
  };
};