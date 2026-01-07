import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { database } from '../services/supabaseClient';

const AddInstrument = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    calibration_required: true,
    calibration_period: 30,
    last_calibration_date: '',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Instrument name is required');
      setLoading(false);
      return;
    }
    
    if (!formData.location.trim()) {
      toast.error('Location is required');
      setLoading(false);
      return;
    }

    try {
      // Prepare instrument data
      const instrumentData = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        calibration_required: formData.calibration_required,
        calibration_period: parseInt(formData.calibration_period) || 30,
        last_calibration_date: formData.last_calibration_date || null,
        notes: formData.notes.trim() || null,
      };

      // Call database function to add instrument
      await database.addInstrument(instrumentData);
      
      toast.success('✅ Instrument added successfully!');
      
      // Reset form
      setFormData({
        name: '',
        location: '',
        calibration_required: true,
        calibration_period: 30,
        last_calibration_date: '',
        notes: ''
      });
      
      // Navigate back to dashboard
      navigate('/');
    } catch (error) {
      console.error('Error adding instrument:', error);
      toast.error(`Failed to add instrument: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => navigate('/')}
          style={{ 
            background: 'none', 
            border: 'none', 
            fontSize: '1.5rem', 
            cursor: 'pointer',
            marginRight: '1rem'
          }}
        >
          ←
        </button>
        <h2 style={{ margin: 0 }}>Add New Instrument</h2>
      </div>
      
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Fill in the instrument details. Fields marked with * are required.
      </p>
      
      <form onSubmit={handleSubmit}>
        {/* Instrument Name */}
        <div className="form-group">
          <label>
            Instrument Name *
            <span style={{ color: '#dc3545', marginLeft: '4px' }}>*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="e.g., Digital Multimeter XYZ-2000"
            disabled={loading}
            style={{ padding: '0.75rem' }}
          />
        </div>
        
        {/* Location */}
        <div className="form-group">
          <label>
            Location *
            <span style={{ color: '#dc3545', marginLeft: '4px' }}>*</span>
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            placeholder="e.g., Lab A, Shelf 3, Drawer 2"
            disabled={loading}
            style={{ padding: '0.75rem' }}
          />
        </div>
        
        {/* Calibration Required */}
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              name="calibration_required"
              checked={formData.calibration_required}
              onChange={handleChange}
              disabled={loading}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontWeight: '600' }}>Calibration Required</span>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>
              (Uncheck if instrument doesn't need calibration)
            </span>
          </label>
        </div>
        
        {/* Calibration Settings - Only show if calibration is required */}
        {formData.calibration_required && (
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '1.5rem', 
            borderRadius: '8px',
            marginBottom: '1.5rem',
            border: '1px solid #dee2e6'
          }}>
            <h4 style={{ marginBottom: '1rem', color: '#495057' }}>Calibration Settings</h4>
            
            {/* Calibration Period */}
            <div className="form-group">
              <label>Calibration Period (days)</label>
              <input
                type="number"
                name="calibration_period"
                value={formData.calibration_period}
                onChange={handleChange}
                min="1"
                max="365"
                disabled={loading}
                style={{ padding: '0.75rem' }}
              />
              <small style={{ color: '#666', display: 'block', marginTop: '0.25rem' }}>
                How often this instrument needs calibration
              </small>
            </div>
            
            {/* Last Calibration Date */}
            <div className="form-group">
              <label>Last Calibration Date</label>
              <input
                type="date"
                name="last_calibration_date"
                value={formData.last_calibration_date}
                onChange={handleChange}
                disabled={loading}
                style={{ padding: '0.75rem' }}
              />
              <small style={{ color: '#666', display: 'block', marginTop: '0.25rem' }}>
                Leave empty if never calibrated
              </small>
            </div>
          </div>
        )}
        
        {/* Notes */}
        <div className="form-group">
          <label>Additional Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="4"
            placeholder="Any additional information about the instrument...
e.g., Special handling instructions, accessories included, maintenance history..."
            disabled={loading}
            style={{ padding: '0.75rem', fontFamily: 'inherit' }}
          />
        </div>
        
        {/* Form Actions */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #dee2e6'
        }}>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
            style={{ 
              padding: '0.75rem 2rem',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="spinner" style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #ffffff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  display: 'inline-block'
                }}></span>
                Saving...
              </span>
            ) : 'Save Instrument'}
          </button>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => navigate('/')}
            disabled={loading}
            style={{ padding: '0.75rem 2rem' }}
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Add CSS for spinner */}
      <style jsx="true">{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default AddInstrument;