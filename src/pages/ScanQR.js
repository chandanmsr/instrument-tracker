import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import jsQR from 'jsqr';

const ScanQR = () => {
  const navigate = useNavigate();
  const [manualId, setManualId] = useState('');
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [isScanningActive, setIsScanningActive] = useState(true);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Check for camera support
  const checkCameraSupport = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API not supported in this browser. Try Chrome, Firefox, or Edge.');
        return false;
      }
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        setCameraError('No camera found on this device.');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking camera:', error);
      setCameraError(`Error checking camera: ${error.message}`);
      return false;
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      setCameraError('');
      setScanning(true);
      setIsScanningActive(true);
      
      const hasCameraAccess = await checkCameraSupport();
      if (!hasCameraAccess) return;
      
      // Stop previous stream if exists
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Request camera access
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', true);
        await videoRef.current.play();
        setHasCamera(true);
        
        // Start QR scanning
        scanQRCode();
      }
    } catch (error) {
      console.error('Camera error:', error);
      handleCameraError(error);
    }
  };

  // Handle camera errors
  const handleCameraError = (error) => {
    let errorMessage = 'Failed to access camera. ';
    
    if (error.name === 'NotAllowedError') {
      errorMessage += 'Please allow camera permissions in your browser settings.';
    } else if (error.name === 'NotFoundError') {
      errorMessage += 'No camera found on this device.';
    } else if (error.name === 'NotReadableError') {
      errorMessage += 'Camera is already in use by another application.';
    } else if (error.name === 'OverconstrainedError') {
      errorMessage += 'Camera constraints could not be satisfied.';
      // Try user-facing camera as fallback
      if (facingMode === 'environment') {
        setFacingMode('user');
        setTimeout(startCamera, 1000);
      }
    } else {
      errorMessage += error.message;
    }
    
    setCameraError(errorMessage);
    setHasCamera(false);
    setIsScanningActive(false);
    
    toast.error('Camera error: ' + errorMessage.split('.')[0]);
  };

  // Stop camera
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setHasCamera(false);
    setScanning(false);
    setIsScanningActive(false);
  };

  // Toggle between front and rear camera
  const toggleCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    setTimeout(startCamera, 500);
  };

  // Scan for QR codes in video stream
  const scanQRCode = () => {
    if (!isScanningActive || !videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data from canvas
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Try to decode QR code
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });
    
    // If QR code found
    if (code) {
      console.log('QR Code found:', code.data);
      handleQRCodeResult(code.data);
    }
    
    // Continue scanning if still active
    if (isScanningActive) {
      animationFrameRef.current = requestAnimationFrame(scanQRCode);
    }
  };

  // Handle QR code result
  const handleQRCodeResult = (result) => {
    stopCamera();
    
    // Extract instrument ID from URL
    const match = result.match(/instrument\/([^\/\?]+)/);
    if (match && match[1]) {
      const instrumentId = match[1];
      toast.success('QR code scanned successfully!');
      navigate(`/instrument/${instrumentId}`);
    } else if (result.match(/^[a-zA-Z0-9-_]+$/)) {
      // If it's just an ID
      toast.success('QR code scanned successfully!');
      navigate(`/instrument/${result}`);
    } else {
      toast.error('Invalid QR code. Please scan an instrument QR code.');
      // Resume scanning after error
      setTimeout(() => {
        startCamera();
      }, 2000);
    }
  };

  // Manual form submission
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualId.trim()) {
      stopCamera();
      navigate(`/instrument/${manualId.trim()}`);
    } else {
      toast.error('Please enter an Instrument ID');
    }
  };

  // Initialize camera on mount
  useEffect(() => {
    startCamera();
    
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => {
            stopCamera();
            navigate('/');
          }}
          style={{ 
            background: 'none', 
            border: 'none', 
            fontSize: '1.5rem', 
            cursor: 'pointer',
            marginRight: '1rem',
            padding: '0.5rem',
            borderRadius: '4px',
            backgroundColor: 'rgba(0,0,0,0.1)'
          }}
        >
          ←
        </button>
        <h2 style={{ margin: 0 }}>Scan Instrument QR Code</h2>
      </div>
      
      {/* Camera Error Message */}
      {cameraError && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>Camera Error</p>
              <p style={{ margin: 0 }}>{cameraError}</p>
              <button 
                onClick={startCamera}
                className="btn btn-secondary"
                style={{ marginTop: '0.5rem', padding: '0.25rem 0.75rem', fontSize: '0.9rem' }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Camera Section */}
      <div className="qr-container" style={{ marginBottom: '2rem' }}>
        <div style={{ 
          position: 'relative',
          width: '100%',
          maxWidth: '500px',
          margin: '0 auto',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#000',
          minHeight: '300px'
        }}>
          {/* Camera Feed */}
          <video
            ref={videoRef}
            style={{
              width: '100%',
              height: '100%',
              minHeight: '300px',
              objectFit: 'cover',
              display: hasCamera ? 'block' : 'none',
              transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
            }}
            playsInline
            muted
          />
          
          {/* Hidden canvas for QR scanning */}
          <canvas 
            ref={canvasRef} 
            style={{ display: 'none' }}
          />
          
          {/* Camera Placeholder */}
          {!hasCamera && !cameraError && (
            <div style={{ 
              width: '100%', 
              height: '300px', 
              backgroundColor: '#333', 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📷</div>
              <p>Initializing camera...</p>
              <div className="spinner" style={{ marginTop: '1rem', borderTopColor: '#fff' }}></div>
            </div>
          )}
          
          {/* Scan Frame Overlay */}
          {hasCamera && (
            <>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '250px',
                height: '250px',
                border: '3px solid #00ff00',
                borderRadius: '12px',
                boxShadow: '0 0 0 1000px rgba(0, 0, 0, 0.7)',
                pointerEvents: 'none'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  width: '100%',
                  height: '100%',
                  border: '2px solid #00ff00',
                  borderRadius: '10px',
                  animation: 'scanPulse 2s infinite'
                }}></div>
                
                {/* Corner markers */}
                {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => (
                  <div
                    key={corner}
                    style={{
                      position: 'absolute',
                      width: '30px',
                      height: '30px',
                      border: '4px solid #00ff00',
                      ...(corner === 'top-left' && { top: '-4px', left: '-4px', borderRight: 'none', borderBottom: 'none' }),
                      ...(corner === 'top-right' && { top: '-4px', right: '-4px', borderLeft: 'none', borderBottom: 'none' }),
                      ...(corner === 'bottom-left' && { bottom: '-4px', left: '-4px', borderRight: 'none', borderTop: 'none' }),
                      ...(corner === 'bottom-right' && { bottom: '-4px', right: '-4px', borderLeft: 'none', borderTop: 'none' }),
                    }}
                  />
                ))}
              </div>
              
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '0',
                right: '0',
                textAlign: 'center',
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: '10px',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                📍 Position QR code within the green frame
              </div>
            </>
          )}
        </div>
        
        {/* Camera Controls */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'center',
          marginTop: '1rem',
          flexWrap: 'wrap'
        }}>
          {hasCamera ? (
            <>
              <button 
                onClick={stopCamera}
                className="btn btn-danger"
                style={{ 
                  padding: '0.5rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                🛑 Stop Camera
              </button>
              <button 
                onClick={toggleCamera}
                className="btn btn-secondary"
                style={{ 
                  padding: '0.5rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                🔄 Switch Camera
              </button>
            </>
          ) : !cameraError ? (
            <button 
              onClick={startCamera}
              className="btn btn-primary"
              style={{ 
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              disabled={!!cameraError}
            >
              ▶️ Start Camera
            </button>
          ) : (
            <button 
              onClick={startCamera}
              className="btn btn-primary"
              style={{ 
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              🔄 Try Again
            </button>
          )}
        </div>
      </div>
      
      {/* Manual Entry Section */}
      <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '1rem' }}>Manual Entry</h3>
        <p style={{ marginBottom: '1rem' }}>
          Can't scan? Enter the Instrument ID manually:
        </p>
        
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="Enter Instrument ID"
            style={{ 
              flex: '1 1 300px', 
              minWidth: '200px',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ 
              padding: '0.75rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            🔍 View Instrument
          </button>
        </form>
      </div>
      
      {/* Instructions */}
      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        backgroundColor: '#e7f3ff', 
        borderRadius: '8px',
        fontSize: '0.9rem'
      }}>
        <h4 style={{ marginBottom: '0.75rem', color: '#1976d2' }}>📋 How to Scan:</h4>
        <ol style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
          <li>Allow camera access when prompted</li>
          <li>Point camera at the instrument's QR code</li>
          <li>Hold steady within the green frame</li>
          <li>You'll be automatically redirected</li>
        </ol>
      </div>
      
      {/* Add CSS for animations */}
      <style jsx="true">{`
        @keyframes scanPulse {
          0% { opacity: 0.3; border-color: #00ff00; }
          50% { opacity: 1; border-color: #00cc00; }
          100% { opacity: 0.3; border-color: #00ff00; }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        
        @media (max-width: 768px) {
          .qr-container > div {
            max-width: 100% !important;
            min-height: 250px !important;
          }
          
          video {
            min-height: 250px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ScanQR;