// src/utils/urlHelper.js
export const getAppBaseUrl = () => {
  // If we have a custom domain or specific URL for production
  const productionUrl = process.env.REACT_APP_PRODUCTION_URL;
  
  if (process.env.NODE_ENV === 'production' && productionUrl) {
    return productionUrl;
  }
  
  return window.location.origin;
};

export const getInstrumentUrl = (instrumentId) => {
  return `${getAppBaseUrl()}/instrument/${instrumentId}`;
};