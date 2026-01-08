import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { QRCodeCanvas } from 'qrcode.react';
import { database } from '../services/supabaseClient';
import { format, addDays, isBefore, differenceInDays, parseISO } from 'date-fns';

const InstrumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [instrument, setInstrument] = useState(null);
  const [qrSize, setQrSize] = useState(200);
  const [showFullNotes, setShowFullNotes] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const qrRef = useRef(null);

  // FIXED: Get correct URL for production
  const getBaseUrl = () => {
    return window.location.origin;
  };

  useEffect(() => {
    loadInstrument();
    
    // Adjust QR size for mobile
    const handleResize = () => {
      setQrSize(window.innerWidth < 768 ? 150 : 200);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    } catch (error) {
      console.error('Error loading instrument:', error);
      toast.error('Failed to load instrument details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = () => {
    if (!instrument) return { 
      status: 'Unknown', 
      message: '', 
      className: '', 
      icon: '❓',
      severity: 'info'
    };
    
    // If calibration not required, always ready
    if (!instrument.calibration_required) {
      return {
        status: 'Ready for Testing',
        message: 'No calibration required for this instrument',
        className: 'alert-success',
        icon: '✅',
        severity: 'success'
      };
    }
    
    // If never calibrated
    if (!instrument.last_calibration_date) {
      return {
        status: 'Not Ready for Testing',
        message: 'Instrument has never been calibrated',
        className: 'alert-error',
        icon: '❌',
        severity: 'error'
      };
    }
    
    // Calculate dates
    let nextCalibration;
    if (instrument.next_calibration_date) {
      nextCalibration = parseISO(instrument.next_calibration_date);
    } else {
      nextCalibration = addDays(parseISO(instrument.last_calibration_date), instrument.calibration_period);
    }
    
    const today = new Date();
    const daysUntilCalibration = differenceInDays(nextCalibration, today);
    
    // Determine status
    if (isBefore(nextCalibration, today)) {
      return {
        status: 'Not Ready for Testing',
        message: `Calibration was due on ${format(nextCalibration, 'MMM dd, yyyy')}`,
        className: 'alert-error',
        icon: '⚠️',
        severity: 'error',
        daysOverdue: Math.abs(daysUntilCalibration)
      };
    }
    
    if (daysUntilCalibration <= 7) {
      return {
        status: 'Ready for Testing (Due Soon)',
        message: `Calibration due in ${daysUntilCalibration} days (${format(nextCalibration, 'MMM dd, yyyy')})`,
        className: 'alert-warning',
        icon: '⏰',
        severity: 'warning'
      };
    }
    
    return {
      status: 'Ready for Testing',
      message: `Next calibration due on ${format(nextCalibration, 'MMM dd, yyyy')}`,
      className: 'alert-success',
      icon: '✅',
      severity: 'success'
    };
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    
    // FIXED: Use current URL
    const qrValue = `${getBaseUrl()}/instrument/${instrument.id}`;
    
    let qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrValue)}`;
    
    // Try to use local canvas if available
    const canvas = document.getElementById('instrument-qr-code-canvas');
    if (canvas) {
      qrCodeUrl = canvas.toDataURL('image/png');
    }
    
    const statusInfo = getStatusInfo();
    const nextCalibrationDate = instrument.next_calibration_date 
      ? parseISO(instrument.next_calibration_date)
      : instrument.last_calibration_date 
        ? addDays(parseISO(instrument.last_calibration_date), instrument.calibration_period)
        : null;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Instrument Details - ${instrument?.name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              max-width: 800px;
              margin: 0 auto;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #333;
            }
            .qr-code { 
              text-align: center; 
              margin: 20px 0;
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 8px;
            }
            .details { 
              margin: 20px 0; 
            }
            .status { 
              padding: 15px; 
              border-radius: 5px; 
              margin: 20px 0;
              border: 1px solid #ddd;
            }
            .status-success { 
              background-color: #d4edda; 
              border-color: #c3e6cb;
            }
            .status-error { 
              background-color: #f8d7da; 
              border-color: #f5c6cb;
            }
            .status-warning { 
              background-color: #fff3cd; 
              border-color: #ffeaa7;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0;
              font-size: 14px;
            }
            td, th { 
              border: 1px solid #ddd; 
              padding: 12px; 
              text-align: left; 
            }
            th { 
              background-color: #f2f2f2;
              font-weight: 600;
            }
            .footer { 
              text-align: center; 
              margin-top: 40px; 
              font-size: 12px; 
              color: #666;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
            @media print {
              body { padding: 0; }
              .header { border-bottom: 2px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin-bottom: 10px;">🔬 Instrument Details</h1>
            <h2 style="margin: 10px 0; color: #333;">${instrument?.name}</h2>
            <p style="font-size: 16px; color: #666;">📍 Location: ${instrument?.location}</p>
          </div>
          
          <div class="qr-code">
            <h3 style="margin-bottom: 15px;">QR Code for Scanning</h3>
            <img src="${qrCodeUrl}" 
                 alt="QR Code for ${instrument?.name}" 
                 style="width: 200px; height: 200px;">
            <p style="margin-top: 10px; font-size: 12px; color: #666;">
              Scan to view instrument details
            </p>
            <p style="font-size: 10px; color: #999; word-break: break-all;">
              ${qrValue}
            </p>
          </div>
          
          <div class="status status-${statusInfo.severity}">
            <h3 style="margin: 0 0 10px 0;">Status: ${statusInfo.status}</h3>
            <p style="margin: 0;">${statusInfo.message}</p>
            ${statusInfo.daysOverdue ? `<p style="margin: 10px 0 0 0; font-weight: 600;">${statusInfo.daysOverdue} days overdue</p>` : ''}
          </div>
          
          <div class="details">
            <h3 style="margin-bottom: 15px;">Instrument Information</h3>
            <table>
              <tr>
                <th style="width: 40%;">Property</th>
                <th style="width: 60%;">Value</th>
              </tr>
              <tr>
                <td><strong>Instrument ID</strong></td>
                <td>${instrument.id}</td>
              </tr>
              <tr>
                <td><strong>Name</strong></td>
                <td>${instrument.name}</td>
              </tr>
              <tr>
                <td><strong>Location</strong></td>
                <td>${instrument.location}</td>
              </tr>
              <tr>
                <td><strong>Calibration Required</strong></td>
                <td>${instrument.calibration_required ? 'Yes' : 'No'}</td>
              </tr>
              ${instrument.calibration_required ? `
                <tr>
                  <td><strong>Calibration Period</strong></td>
                  <td>${instrument.calibration_period} days</td>
                </tr>
                <tr>
                  <td><strong>Last Calibration</strong></td>
                  <td>${instrument.last_calibration_date ? 
                    format(parseISO(instrument.last_calibration_date), 'MMMM dd, yyyy') : 
                    'Never'}</td>
                </tr>
                <tr>
                  <td><strong>Next Calibration</strong></td>
                  <td>${nextCalibrationDate ? 
                    format(nextCalibrationDate, 'MMMM dd, yyyy') : 
                    'Not calculated'}</td>
                </tr>
              ` : ''}
              <tr>
                <td><strong>Date Added</strong></td>
                <td>${format(parseISO(instrument.created_at), 'MMMM dd, yyyy')}</td>
              </tr>
              ${instrument.updated_at ? `
                <tr>
                  <td><strong>Last Updated</strong></td>
                  <td>${format(parseISO(instrument.updated_at), 'MMMM dd, yyyy')}</td>
                </tr>
              ` : ''}
              ${instrument.notes ? `
                <tr>
                  <td><strong>Notes</strong></td>
                  <td style="white-space: pre-wrap;">${instrument.notes}</td>
                </tr>
              ` : ''}
            </table>
          </div>
          
          <div class="footer">
            <p>Printed from Instrument Tracker</p>
            <p>Date: ${format(new Date(), 'MMMM dd, yyyy hh:mm a')}</p>
            <p>URL: ${getBaseUrl()}/instrument/${id}</p>
          </div>
          
          <script>
            // Auto-print after a short delay
            setTimeout(() => {
              window.print();
            }, 500);
            
            // Close window after printing
            window.onafterprint = function() {
              setTimeout(() => {
                window.close();
              }, 1000);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById('instrument-qr-code-canvas');
    
    if (!canvas) {
      toast.error('QR code canvas not found');
      return;
    }
    
    try {
      // Convert canvas to PNG data URL
      const pngUrl = canvas.toDataURL('image/png');
      
      // Create a temporary link element
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `instrument-${instrument?.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-qrcode.png`;
      
      // Append to body, click, and remove
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast.success('✅ QR code downloaded as PNG');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR code');
    }
  };

  const confirmDelete = () => {
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleting(false);
  };

  const handleDelete = async () => {
    if (!instrument) return;
    
    setDeleting(true);
    
    try {
      await database.deleteInstrument(instrument.id);
      
      toast.success(`"${instrument.name}" deleted successfully`);
      navigate('/');
    } catch (error) {
      console.error('Error deleting instrument:', error);
      toast.error('Failed to delete instrument');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="spinner"></div>
        <p>Loading instrument details...</p>
      </div>
    );
  }

  if (!instrument) {
    return null;
  }

  const statusInfo = getStatusInfo();
  
  // FIXED: Use current URL for QR
  const qrValue = `${getBaseUrl()}/instrument/${instrument.id}`;
  
  const nextCalibrationDate = instrument.next_calibration_date 
    ? parseISO(instrument.next_calibration_date)
    : instrument.last_calibration_date 
      ? addDays(parseISO(instrument.last_calibration_date), instrument.calibration_period)
      : null;

  return (
    <div className="card">
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
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
              Are you sure you want to delete <strong>"{instrument.name}"</strong>?
            </p>
            
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '1rem', 
              borderRadius: '6px',
              marginBottom: '1.5rem'
            }}>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Location:</strong> {instrument.location}
              </p>
              <p style={{ margin: 0 }}>
                <strong>ID:</strong> {instrument.id}
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
                disabled={deleting}
                style={{ padding: '0.75rem 1.5rem' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className="btn btn-primary"
                disabled={deleting}
                style={{ 
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#dc3545',
                  borderColor: '#dc3545'
                }}
              >
                {deleting ? (
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

      {/* Header with navigation */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <button 
          onClick={() => navigate('/')}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          ← Back to Dashboard
        </button>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            onClick={handlePrint}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            🖨️ Print
          </button>
          <button 
            onClick={() => navigate(`/update/${instrument.id}`)}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            🔧 Update Calibration
          </button>
        </div>
      </div>
      
      {/* Instrument Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem', color: '#333' }}>{instrument.name}</h1>
        <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '0.5rem' }}>
          📍 {instrument.location}
        </p>
        <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>
          Instrument ID: {instrument.id} | Added: {format(parseISO(instrument.created_at), 'MMM dd, yyyy')}
        </p>
      </div>
      
      {/* Status Alert */}
      <div className={`alert ${statusInfo.className}`} style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '2rem' }}>{statusInfo.icon}</span>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>{statusInfo.status}</h3>
            <p style={{ margin: 0 }}>{statusInfo.message}</p>
            {statusInfo.daysOverdue && (
              <p style={{ margin: '0.25rem 0 0 0', fontWeight: '600' }}>
                {statusInfo.daysOverdue} days overdue
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Two Column Layout */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Left Column - QR Code */}
        <div className="qr-container" style={{ textAlign: 'center' }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '1rem', 
            borderRadius: '8px',
            display: 'inline-block',
            marginBottom: '1rem',
            border: '1px solid #dee2e6'
          }}>
            <QRCodeCanvas
              id="instrument-qr-code-canvas"
              ref={qrRef}
              value={qrValue}
              size={qrSize}
              level="H"
              includeMargin
            />
          </div>
          <p style={{ marginBottom: '1rem', color: '#666' }}>
            Scan this QR code to view this instrument
          </p>
          <button 
            onClick={handleDownloadQR}
            className="btn btn-primary"
            style={{ marginBottom: '0.5rem' }}
          >
            📥 Download QR Code (PNG)
          </button>
          <p style={{ fontSize: '0.8rem', color: '#6c757d', marginTop: '0.5rem' }}>
            URL: {qrValue}
          </p>
        </div>
        
        {/* Right Column - Instrument Details */}
        <div>
          <h3 style={{ marginBottom: '1.5rem', color: '#495057' }}>Instrument Details</h3>
          
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '1.5rem', 
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '0.75rem 0', fontWeight: '600', width: '50%' }}>Calibration Required:</td>
                  <td style={{ padding: '0.75rem 0' }}>
                    <span style={{ 
                      display: 'inline-block', 
                      padding: '0.25rem 0.75rem',
                      backgroundColor: instrument.calibration_required ? '#fff3cd' : '#d4edda',
                      color: instrument.calibration_required ? '#856404' : '#155724',
                      borderRadius: '4px',
                      fontWeight: '600'
                    }}>
                      {instrument.calibration_required ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
                
                {instrument.calibration_required && (
                  <>
                    <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '0.75rem 0', fontWeight: '600' }}>Calibration Period:</td>
                      <td style={{ padding: '0.75rem 0' }}>
                        {instrument.calibration_period} days
                      </td>
                    </tr>
                    
                    {instrument.last_calibration_date && (
                      <>
                        <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                          <td style={{ padding: '0.75rem 0', fontWeight: '600' }}>Last Calibration:</td>
                          <td style={{ padding: '0.75rem 0' }}>
                            {format(parseISO(instrument.last_calibration_date), 'MMMM dd, yyyy')}
                          </td>
                        </tr>
                        
                        <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                          <td style={{ padding: '0.75rem 0', fontWeight: '600' }}>Next Calibration:</td>
                          <td style={{ padding: '0.75rem 0' }}>
                            {nextCalibrationDate ? 
                              format(nextCalibrationDate, 'MMMM dd, yyyy') : 
                              'Not calculated'
                            }
                            {nextCalibrationDate && (
                              <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                                {differenceInDays(nextCalibrationDate, new Date())} days from now
                              </div>
                            )}
                          </td>
                        </tr>
                      </>
                    )}
                  </>
                )}
                
                <tr>
                  <td style={{ padding: '0.75rem 0', fontWeight: '600' }}>Date Added:</td>
                  <td style={{ padding: '0.75rem 0' }}>
                    {format(parseISO(instrument.created_at), 'MMMM dd, yyyy')}
                  </td>
                </tr>
                
                <tr>
                  <td style={{ padding: '0.75rem 0', fontWeight: '600' }}>Last Updated:</td>
                  <td style={{ padding: '0.75rem 0' }}>
                    {instrument.updated_at ? 
                      format(parseISO(instrument.updated_at), 'MMMM dd, yyyy') : 
                      'Never'
                    }
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {instrument.notes && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ margin: 0, color: '#495057' }}>Notes</h4>
                {instrument.notes.length > 200 && (
                  <button 
                    onClick={() => setShowFullNotes(!showFullNotes)}
                    className="btn btn-secondary"
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                  >
                    {showFullNotes ? 'Show Less' : 'Show More'}
                  </button>
                )}
              </div>
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '1rem', 
                borderRadius: '6px',
                whiteSpace: 'pre-wrap',
                fontSize: '0.95rem',
                lineHeight: '1.5',
                maxHeight: showFullNotes ? 'none' : '200px',
                overflow: showFullNotes ? 'visible' : 'hidden'
              }}>
                {instrument.notes}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        justifyContent: 'center',
        marginTop: '2rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid #dee2e6',
        flexWrap: 'wrap'
      }}>
        <button 
          onClick={() => navigate(`/update/${instrument.id}`)}
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          🔧 Update Calibration
        </button>
        <button 
          onClick={() => navigate('/scan')}
          className="btn btn-secondary"
          style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          📷 Scan Another QR
        </button>
        <button 
          onClick={() => navigate('/add')}
          className="btn btn-secondary"
          style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          ➕ Add New Instrument
        </button>
        <button 
          onClick={confirmDelete}
          className="btn btn-secondary"
          style={{ 
            padding: '0.75rem 1.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            backgroundColor: '#dc3545',
            borderColor: '#dc3545'
          }}
        >
          🗑️ Delete Instrument
        </button>
      </div>

      {/* Responsive styles */}
      <style jsx="true">{`
        @media (max-width: 768px) {
          .card > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InstrumentDetail;