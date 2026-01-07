import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { database } from '../services/supabaseClient';
import { QRCodeCanvas } from 'qrcode.react';
import { format, addDays, isBefore, differenceInDays } from 'date-fns';

const Dashboard = () => {
  const [instruments, setInstruments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [instrumentToDelete, setInstrumentToDelete] = useState(null);

  // Get the current URL for QR codes - FIXED for production
  const getBaseUrl = () => {
    return window.location.origin;
  };

  useEffect(() => {
    loadInstruments();
  }, []);

  const loadInstruments = async () => {
    try {
      setLoading(true);
      const data = await database.getInstruments();
      setInstruments(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load instruments');
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (instrument) => {
    if (!instrument.calibration_required) return 'Ready';
    if (!instrument.last_calibration_date) return 'Not Ready';
    
    if (!instrument.next_calibration_date) return 'Not Ready';
    
    const nextCalibration = new Date(instrument.next_calibration_date);
    const today = new Date();
    
    if (isBefore(nextCalibration, today)) return 'Overdue';
    
    const daysUntil = differenceInDays(nextCalibration, today);
    if (daysUntil <= 7) return 'Due Soon';
    
    return 'Ready';
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Ready': return 'status-ready';
      case 'Not Ready': return 'status-not-ready';
      case 'Overdue': return 'status-not-ready';
      case 'Due Soon': return 'status-warning';
      default: return '';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Ready': return '✅';
      case 'Not Ready': return '❌';
      case 'Overdue': return '⚠️';
      case 'Due Soon': return '⏰';
      default: return '❓';
    }
  };

  const refreshData = () => {
    loadInstruments();
    toast.info('Dashboard refreshed');
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
  };

  // Confirm delete modal
  const confirmDelete = (instrument) => {
    setInstrumentToDelete(instrument);
    setShowDeleteModal(true);
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setInstrumentToDelete(null);
    setDeletingId(null);
  };

  // Delete instrument
  const handleDelete = async () => {
    if (!instrumentToDelete) return;
    
    setDeletingId(instrumentToDelete.id);
    
    try {
      await database.deleteInstrument(instrumentToDelete.id);
      
      // Update local state
      setInstruments(prev => prev.filter(inst => inst.id !== instrumentToDelete.id));
      
      toast.success(`"${instrumentToDelete.name}" deleted successfully`);
      
      // Close modal and reset
      cancelDelete();
    } catch (error) {
      console.error('Error deleting instrument:', error);
      toast.error('Failed to delete instrument');
      setDeletingId(null);
    }
  };

  // Filter instruments based on search and status
  const filteredInstruments = instruments.filter(instrument => {
    const matchesSearch = 
      instrument.name.toLowerCase().includes(searchTerm) ||
      instrument.location.toLowerCase().includes(searchTerm) ||
      (instrument.notes && instrument.notes.toLowerCase().includes(searchTerm));
    
    if (filterStatus === 'all') return matchesSearch;
    
    const status = getStatus(instrument);
    if (filterStatus === 'ready') return matchesSearch && status === 'Ready';
    if (filterStatus === 'not_ready') return matchesSearch && (status === 'Not Ready' || status === 'Overdue');
    if (filterStatus === 'due_soon') return matchesSearch && status === 'Due Soon';
    if (filterStatus === 'overdue') return matchesSearch && status === 'Overdue';
    
    return matchesSearch;
  });

  // Calculate stats - FIXED to include all statuses
  const stats = {
    total: instruments.length,
    ready: instruments.filter(i => getStatus(i) === 'Ready').length,
    notReady: instruments.filter(i => getStatus(i) === 'Not Ready').length,
    overdue: instruments.filter(i => getStatus(i) === 'Overdue').length,
    dueSoon: instruments.filter(i => getStatus(i) === 'Due Soon').length,
    notCalibrated: instruments.filter(i => !i.last_calibration_date && i.calibration_required).length
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="spinner"></div>
        <p className="mt-2">Loading instruments...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Delete Confirmation Modal */}
      {showDeleteModal && instrumentToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
            <h3 style={{ color: '#dc3545', marginBottom: '1rem' }}>⚠️ Delete Instrument</h3>
            
            <p style={{ marginBottom: '1.5rem' }}>
              Are you sure you want to delete <strong>"{instrumentToDelete.name}"</strong>?
            </p>
            
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '1rem', 
              borderRadius: '6px',
              marginBottom: '1.5rem'
            }}>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Location:</strong> {instrumentToDelete.location}
              </p>
              <p style={{ margin: 0 }}>
                <strong>ID:</strong> {instrumentToDelete.id}
              </p>
            </div>
            
            <div style={{ 
              backgroundColor: '#fff3cd', 
              padding: '1rem', 
              borderRadius: '6px',
              marginBottom: '1.5rem',
              border: '1px solid #ffeaa7'
            }}>
              <p style={{ margin: 0, color: '#856404' }}>
                ⚠️ This action cannot be undone. All calibration history will be lost.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={cancelDelete}
                className="btn btn-secondary"
                disabled={deletingId === instrumentToDelete.id}
                style={{ padding: '0.75rem 1.5rem' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className="btn btn-primary"
                disabled={deletingId === instrumentToDelete.id}
                style={{ 
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#dc3545',
                  borderColor: '#dc3545'
                }}
              >
                {deletingId === instrumentToDelete.id ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #ffffff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      display: 'inline-block'
                    }}></span>
                    Deleting...
                  </span>
                ) : 'Delete Instrument'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Instrument Dashboard</h2>
          <p style={{ color: '#666', marginTop: '0.5rem' }}>
            Track and manage all your instruments
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            onClick={refreshData}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 1rem' }}
          >
            🔄 Refresh
          </button>
          <Link to="/add" className="btn btn-primary">
            ➕ Add Instrument
          </Link>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              🔍 Search Instruments
            </label>
            <input
              type="text"
              placeholder="Search by name, location, or notes..."
              value={searchTerm}
              onChange={handleSearch}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>
          <div style={{ minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              📊 Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                backgroundColor: 'white'
              }}
            >
              <option value="all">All Instruments</option>
              <option value="ready">Ready for Use</option>
              <option value="not_ready">Not Ready (Including Overdue)</option>
              <option value="due_soon">Due Soon (≤ 7 days)</option>
              <option value="overdue">Overdue Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Summary - FIXED: Not Ready includes Overdue */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Quick Stats</h3>
          <span style={{ fontSize: '0.9rem', color: '#666' }}>
            Total: {stats.total} instruments
          </span>
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '1rem'
        }}>
          <div style={{ 
            backgroundColor: '#e7f3ff', 
            padding: '1rem', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1976d2' }}>{stats.total}</div>
            <div style={{ color: '#495057', fontSize: '0.9rem' }}>Total Instruments</div>
          </div>
          
          <div style={{ 
            backgroundColor: '#d4edda', 
            padding: '1rem', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>{stats.ready}</div>
            <div style={{ color: '#495057', fontSize: '0.9rem' }}>Ready for Use</div>
          </div>
          
          <div style={{ 
            backgroundColor: '#fff3cd', 
            padding: '1rem', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>{stats.dueSoon}</div>
            <div style={{ color: '#495057', fontSize: '0.9rem' }}>Due Soon</div>
          </div>
          
          <div style={{ 
            backgroundColor: '#f8d7da', 
            padding: '1rem', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc3545' }}>{stats.notReady + stats.overdue}</div>
            <div style={{ color: '#495057', fontSize: '0.9rem' }}>
              Not Ready
              <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: '#666' }}>
                ({stats.overdue} overdue, {stats.notReady} never calibrated)
              </div>
            </div>
          </div>
        </div>
        
        {/* Detailed Status Breakdown */}
        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1rem', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          fontSize: '0.9rem'
        }}>
          <h4 style={{ marginBottom: '0.75rem' }}>Detailed Status Breakdown</h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ color: '#28a745', fontWeight: '600' }}>✅ Ready:</span> {stats.ready}
            </div>
            <div>
              <span style={{ color: '#ffc107', fontWeight: '600' }}>⏰ Due Soon:</span> {stats.dueSoon}
            </div>
            <div>
              <span style={{ color: '#dc3545', fontWeight: '600' }}>⚠️ Overdue:</span> {stats.overdue}
            </div>
            <div>
              <span style={{ color: '#dc3545', fontWeight: '600' }}>❌ Never Calibrated:</span> {stats.notCalibrated}
            </div>
          </div>
        </div>
      </div>

      {/* Instruments Grid */}
      {filteredInstruments.length === 0 ? (
        <div className="card text-center">
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
          <h3>No instruments found</h3>
          <p className="mt-1">
            {instruments.length === 0 
              ? 'Add your first instrument to get started!' 
              : 'No instruments match your search criteria'}
          </p>
          {instruments.length === 0 && (
            <Link to="/add" className="btn btn-primary mt-2">
              Add First Instrument
            </Link>
          )}
        </div>
      ) : (
        <>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '1rem' 
          }}>
            <h3>Instruments ({filteredInstruments.length})</h3>
            <div style={{ color: '#666', fontSize: '0.9rem' }}>
              Showing {filteredInstruments.length} of {instruments.length} instruments
            </div>
          </div>

          <div className="instrument-grid">
            {filteredInstruments.map((instrument) => {
              const status = getStatus(instrument);
              const statusIcon = getStatusIcon(status);
              const isOverdue = status === 'Overdue';
              
              // FIXED: Use current origin for QR codes
              const qrUrl = `${getBaseUrl()}/instrument/${instrument.id}`;
              
              return (
                <div key={instrument.id} className="card">
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'start', 
                    marginBottom: '1rem' 
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>
                        {statusIcon} {instrument.name}
                        {isOverdue && (
                          <span style={{ 
                            marginLeft: '0.5rem', 
                            fontSize: '0.7rem', 
                            backgroundColor: '#dc3545',
                            color: 'white',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '3px',
                            fontWeight: '600'
                          }}>
                            OVERDUE
                          </span>
                        )}
                      </h3>
                      <p style={{ color: '#666', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        📍 {instrument.location}
                      </p>
                      <span className={getStatusColor(status)} style={{ fontSize: '0.9rem' }}>
                        Status: {status}
                      </span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      {/* FIXED: QR code uses current URL */}
                      <QRCodeCanvas
                        value={qrUrl}
                        size={60}
                        includeMargin
                      />
                      <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>Scan QR</p>
                    </div>
                  </div>
                  
                  {instrument.calibration_required && instrument.last_calibration_date && (
                    <div style={{ 
                      backgroundColor: '#f8f9fa', 
                      padding: '0.75rem', 
                      borderRadius: '6px',
                      marginBottom: '1rem',
                      fontSize: '0.85rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span>Last Calibration:</span>
                        <span>{format(new Date(instrument.last_calibration_date), 'MMM dd, yyyy')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Next Calibration:</span>
                        <span>{instrument.next_calibration_date ? 
                          format(new Date(instrument.next_calibration_date), 'MMM dd, yyyy') : 
                          'N/A'
                        }</span>
                      </div>
                      {instrument.next_calibration_date && (
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          marginTop: '0.25rem',
                          color: isOverdue ? '#dc3545' : '#666',
                          fontSize: '0.8rem'
                        }}>
                          <span>Days remaining:</span>
                          <span>
                            {differenceInDays(new Date(instrument.next_calibration_date), new Date())} days
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {instrument.notes && instrument.notes.length > 0 && (
                    <div style={{ 
                      marginBottom: '1rem',
                      padding: '0.5rem',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      maxHeight: '3em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      📝 {instrument.notes.substring(0, 50)}...
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <Link 
                      to={`/instrument/${instrument.id}`} 
                      className="btn btn-secondary" 
                      style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}
                    >
                      👁️ View
                    </Link>
                    <Link 
                      to={`/update/${instrument.id}`} 
                      className="btn btn-primary" 
                      style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}
                    >
                      🔧 Update
                    </Link>
                    <button 
                      onClick={() => confirmDelete(instrument)}
                      className="btn btn-secondary" 
                      style={{ 
                        flex: 1, 
                        padding: '0.5rem', 
                        fontSize: '0.9rem',
                        backgroundColor: '#dc3545',
                        borderColor: '#dc3545',
                        color: 'white'
                      }}
                      disabled={deletingId === instrument.id}
                    >
                      {deletingId === instrument.id ? '...' : '🗑️ Delete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;