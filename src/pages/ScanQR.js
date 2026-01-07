import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ScanQR = () => {
  const navigate = useNavigate();
  const [manualId, setManualId] = useState('');

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualId) {
      navigate(`/instrument/${manualId}`);
    }
  };

  return (
    <div className="card">
      <h2>Scan Instrument QR Code</h2>
      
      <div className="qr-container">
        <div style={{ 
          width: '300px', 
          height: '300px', 
          backgroundColor: '#f0f0f0', 
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <p>📷 QR Scanner Placeholder</p>
        </div>
        <p>Point your camera at the instrument's QR code</p>
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>Manual Entry</h3>
        <p style={{ marginBottom: '1rem' }}>If you can't scan, enter the Instrument ID manually:</p>
        
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="Enter Instrument ID"
            style={{ flex: 1, padding: '0.75rem' }}
          />
          <button type="submit" className="btn btn-primary">
            View Details
          </button>
        </form>
      </div>
      
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <button onClick={() => navigate('/')} className="btn btn-secondary">
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default ScanQR;