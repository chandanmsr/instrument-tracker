import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Dashboard from './pages/Dashboard';
import AddInstrument from './pages/AddInstrument';
import ScanQR from './pages/ScanQR';
import UpdateCalibration from './pages/UpdateCalibration';
import InstrumentDetail from './pages/InstrumentDetail';

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="header">
          <nav className="nav">
            <h1>🔬 Instrument Tracker</h1>
            <div className="nav-links">
              <Link to="/">Dashboard</Link>
              <Link to="/add">Add Instrument</Link>
              <Link to="/scan">Scan QR</Link>
            </div>
          </nav>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddInstrument />} />
            <Route path="/scan" element={<ScanQR />} />
            <Route path="/update/:id" element={<UpdateCalibration />} />
            <Route path="/instrument/:id" element={<InstrumentDetail />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>Instrument Tracking System © {new Date().getFullYear()}</p>
        </footer>
        
        <ToastContainer position="bottom-right" />
      </div>
    </Router>
  );
}

export default App;