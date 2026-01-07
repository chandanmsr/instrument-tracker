import React, { useState, useEffect } from 'react';
import { checkSupabaseConnection } from '../services/supabaseClient';

const TestConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState('Checking...');
  const [localStorageStatus, setLocalStorageStatus] = useState('Checking...');
  const [envVariables, setEnvVariables] = useState({});

  useEffect(() => {
    // Check Supabase connection
    checkSupabaseConnection().then(result => {
      setConnectionStatus(result.message);
    });

    // Check localStorage
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      setLocalStorageStatus('Working ✅');
    } catch (error) {
      setLocalStorageStatus(`Error: ${error.message}`);
    }

    // Show environment variables (without sensitive info)
    setEnvVariables({
      nodeEnv: process.env.NODE_ENV,
      supabaseUrl: process.env.REACT_APP_SUPABASE_URL ? 'Set' : 'Not Set',
      origin: window.location.origin,
    });
  }, []);

  return (
    <div className="card">
      <h2>🔧 Connection Test</h2>
      
      <div style={{ marginBottom: '2rem' }}>
        <h3>Current URL: {window.location.origin}</h3>
        <p>Environment: {process.env.NODE_ENV}</p>
      </div>

      <div style={{ 
        backgroundColor: connectionStatus.includes('Connected') ? '#d4edda' : '#f8d7da',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1rem'
      }}>
        <h3>Supabase Status</h3>
        <p>{connectionStatus}</p>
      </div>

      <div style={{ 
        backgroundColor: localStorageStatus.includes('✅') ? '#d4edda' : '#f8d7da',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1rem'
      }}>
        <h3>LocalStorage Status</h3>
        <p>{localStorageStatus}</p>
      </div>

      <div className="card">
        <h3>Environment Variables</h3>
        <table style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td><strong>NODE_ENV</strong></td>
              <td>{envVariables.nodeEnv}</td>
            </tr>
            <tr>
              <td><strong>REACT_APP_SUPABASE_URL</strong></td>
              <td>{envVariables.supabaseUrl}</td>
            </tr>
            <tr>
              <td><strong>Window Origin</strong></td>
              <td>{envVariables.origin}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3>QR Code Test</h3>
        <p>This QR should point to: {window.location.origin}/instrument/test-id</p>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          {/* Add QRCodeCanvas import if needed */}
          {/* <QRCodeCanvas value={`${window.location.origin}/instrument/test-id`} size={150} /> */}
        </div>
      </div>
    </div>
  );
};

export default TestConnection;