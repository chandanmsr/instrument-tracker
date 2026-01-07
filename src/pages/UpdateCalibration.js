import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { database } from '../services/supabaseClient';
import { format, addDays } from 'date-fns';

const UpdateCalibration = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [instrument, setInstrument] = useState(null);
  const [formData, setFormData] = useState({
    last_calibration_date: '',
    cleaned: false,
    performed_by: '',
    notes: ''
  });

  useEffect(() => {
    loadInstrument();
  }, [id]);

  const loadInstrument = async () => {
    try {
      setLoading(true);
      const foundInstrument = await database.getInstrument(id);
      
      if (!foundInstrument) {
        toast.error('Instrument not found');
        navigate('/');
        return;
      }
      
      setInstrument(foundInstrument);
      
      // Set form with today's date as default
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        last_calibration_date: today,
        cleaned: false,
        performed_by: '',
        notes: ''
      });
      
    } catch (error) {
      console.error('Error loading instrument:', error);
      toast.error('Failed to load instrument');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!instrument) return;
    
    // Validate required fields
    if (!formData.last_calibration_date) {
      toast.error('Calibration date is required');
      return;
    }

    setSaving(true);
    
    try {
      // Update the instrument calibration
      await database.updateCalibration(id, {
        last_calibration_date: formData.last_calibration_date,
        notes: formData.notes ? 
          `Calibration performed by: ${formData.performed_by || 'Not specified'}\n` +
          `Cleaned: ${formData.cleaned ? 'Yes' : 'No'}\n` +
          `Additional notes: ${formData.notes}` : 
          `Calibration performed by: ${formData.performed_by || 'Not specified'}\n` +
          `Cleaned: ${formData.cleaned ? 'Yes' : 'No'}`
      });
      
      toast.success('✅ Calibration updated successfully!');
      navigate(`/instrument/${id}`);
      
    } catch (error) {
      console.error('Error updating calibration:', error);
      toast.error(`Failed to update calibration: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="spinner" style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1.5rem'
        }}></div>
        <p>Loading instrument details...</p>
      </div>
    );
  }

  if (!instrument) {
    return (
      <div className="card">
        <h2>Instrument Not Found</h2>
        <p>The instrument you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Calculate next calibration date
  const nextCalibrationDate = formData.last_calibration_date && instrument.calibration_required
    ? addDays(new Date(formData.last_calibration_date), instrument.calibration_period)
    : null;

  return (
    <div className="card">
      {/* Header with back button */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => navigate(`/instrument/${id}`)}
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
        <div>
          <h2 style={{ margin: 0 }}>Update Calibration</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#667eea', fontSize: '1.1rem' }}>
            {instrument.name}
          </p>
          <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
            Location: {instrument.location}
          </p>
        </div>
      </div>
      
      {/* Status alert */}
      <div className="alert alert-success" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>✅</span>
          <div>
            <strong>This will mark the instrument as "Ready for Testing"</strong>
            <p style={{ margin: '0.25rem 0 0 0' }}>
              After saving, the instrument status will be updated immediately
            </p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Calibration Date */}
        <div className="form-group">
          <label>
            Calibration Date *
            <span style={{ color: '#dc3545', marginLeft: '4px' }}>*</span>
          </label>
          <input
            type="date"
            name="last_calibration_date"
            value={formData.last_calibration_date}
            onChange={handleChange}
            required
            disabled={saving}
            style={{ padding: '0.75rem' }}
          />
        </div>
        
        {/* Next Calibration Info */}
        {instrument.calibration_required && formData.last_calibration_date && nextCalibrationDate && (
          <div style={{ 
            backgroundColor: '#e7f3ff', 
            padding: '1rem', 
            borderRadius: '6px',
            marginBottom: '1.5rem',
            border: '1px solid #b3d7ff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>📅</span>
              <strong>Next Calibration Due:</strong>
            </div>
            <p style={{ 
              fontSize: '1.1rem', 
              fontWeight: '600', 
              color: '#1976d2',
              margin: 0
            }}>
              {format(nextCalibrationDate, 'EEEE, MMMM dd, yyyy')}
            </p>
            <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
              Based on {instrument.calibration_period}-day calibration period
            </p>
          </div>
        )}
        
        {/* Performed By */}
        <div className="form-group">
          <label>Performed By (Optional)</label>
          <input
            type="text"
            name="performed_by"
            value={formData.performed_by}
            onChange={handleChange}
            placeholder="Enter technician name"
            disabled={saving}
            style={{ padding: '0.75rem' }}
          />
          <small style={{ color: '#666', display: 'block', marginTop: '0.25rem' }}>
            Name of person who performed the calibration
          </small>
        </div>
        
        {/* Cleaning Checkbox */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            padding: '0.75rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            border: '1px solid #dee2e6'
          }}>
            <input
              type="checkbox"
              name="cleaned"
              checked={formData.cleaned}
              onChange={handleChange}
              disabled={saving}
              style={{ width: '18px', height: '18px' }}
            />
            <div>
              <span style={{ fontWeight: '600' }}>Instrument was cleaned</span>
              <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                Check if the instrument was cleaned during maintenance
              </p>
            </div>
          </label>
        </div>
        
        {/* Calibration Notes */}
        <div className="form-group">
          <label>Calibration Notes (Optional)</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="4"
            placeholder="Enter details about this calibration...
e.g., Calibration standards used, any issues found, adjustments made, etc."
            disabled={saving}
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
            disabled={saving}
            style={{ 
              padding: '0.75rem 2rem',
              opacity: saving ? 0.7 : 1,
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? (
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
                Updating...
              </span>
            ) : 'Update Calibration'}
          </button>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => navigate(`/instrument/${id}`)}
            disabled={saving}
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

export default UpdateCalibration;