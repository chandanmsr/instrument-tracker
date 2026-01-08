# 🔬 Instrument Tracker

A modern web application for tracking laboratory instruments, managing calibration schedules, and accessing equipment information via QR codes.

![React](https://img.shields.io/badge/React-19.2.3-blue)
![Supabase](https://img.shields.io/badge/Supabase-2.89.0-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 📊 **Dashboard**
- Real-time instrument status overview
- Filter and search instruments by name, location, or status
- QR code generation for each instrument
- Delete instruments with confirmation

### 🎯 **Instrument Management**
- Add new instruments with detailed specifications
- Track calibration requirements and periods
- Update calibration records
- View comprehensive instrument details

### 📱 **QR Code Integration**
- Generate QR codes for quick instrument access
- Scan QR codes to view instrument details
- Manual instrument ID entry option
- Download QR codes as PNG images

### 📅 **Calibration Tracking**
- Automatic status calculation (Ready, Due Soon, Overdue)
- Next calibration date calculation
- Visual status indicators
- Printable calibration reports

## 🛠️ Technology Stack

- **Frontend**: React 19, React Router DOM
- **Database**: Supabase (PostgreSQL) with localStorage fallback
- **Styling**: CSS3 with responsive design
- **QR Codes**: QRCode.react + jsQR for scanning
- **Date Handling**: date-fns
- **Notifications**: react-toastify
- **Testing**: React Testing Library

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm/yarn
- Supabase account (optional - includes localStorage fallback)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/instrument-tracker.git
cd instrument-tracker
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Set up Supabase Database** (optional)
Run this SQL in your Supabase SQL editor:
```sql
CREATE TABLE instruments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  calibration_required BOOLEAN DEFAULT true,
  calibration_period INTEGER DEFAULT 30,
  last_calibration_date DATE,
  next_calibration_date DATE,
  status TEXT DEFAULT 'not_ready',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

5. **Start the development server**
```bash
npm start
```
Visit `http://localhost:3000` in your browser.

## 📁 Project Structure

```
instrument-tracker/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── pages/
│   │   ├── Dashboard.js       # Main dashboard
│   │   ├── AddInstrument.js   # Add new instrument
│   │   ├── InstrumentDetail.js # Instrument details
│   │   ├── ScanQR.js         # QR code scanner
│   │   └── UpdateCalibration.js # Update calibration
│   ├── services/
│   │   └── supabaseClient.js  # Database configuration
│   ├── utils/
│   │   └── urlHelper.js       # URL utilities
│   ├── App.js                 # Main app component
│   ├── App.css                # Global styles
│   └── index.js               # Entry point
├── .env                       # Environment variables
├── package.json              # Dependencies
└── README.md                 # This file
```

## 🎨 Key Features Explained

### **Dual Database Strategy**
The app uses Supabase for production but automatically falls back to localStorage when:
- Supabase credentials aren't configured
- Internet connection is lost
- In development mode

### **Responsive Design**
- Mobile-first approach
- Works on all screen sizes
- Touch-friendly interface

### **QR Code System**
1. Each instrument gets a unique QR code
2. QR codes link directly to instrument details
3. Can be printed and attached to instruments
4. Mobile scanning with camera access

### **Status Calculation**
Instruments are automatically categorized:
- **✅ Ready**: Calibrated and within period
- **⏰ Due Soon**: Calibration due in ≤ 7 days
- **⚠️ Overdue**: Calibration past due
- **❌ Not Ready**: Never calibrated

## 🔧 API Reference

### Database Functions
```javascript
// Get all instruments
await database.getInstruments();

// Get single instrument
await database.getInstrument(id);

// Add new instrument
await database.addInstrument(data);

// Update calibration
await database.updateCalibration(id, data);

// Delete instrument
await database.deleteInstrument(id);
```

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_SUPABASE_URL` | Supabase project URL | Optional |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase anonymous key | Optional |

## 📱 Usage Guide

### Adding a New Instrument
1. Click "Add Instrument" from dashboard
2. Fill in instrument details
3. Set calibration requirements
4. Save to generate QR code

### Scanning QR Codes
1. Click "Scan QR" from navigation
2. Allow camera permissions
3. Point camera at instrument QR code
4. Automatically redirected to instrument details

### Updating Calibration
1. Click "Update" on instrument card
2. Enter new calibration date
3. Next calibration date is automatically calculated
4. Instrument status updates immediately

### Printing Reports
1. Navigate to instrument details
2. Click "Print" button
3. Get comprehensive report with QR code

## 🌐 Deployment

### Deploy to Render (Recommended)
1. Fork this repository
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Add environment variables:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
5. Deploy!

### Build for Production
```bash
npm run build
```
Deploy the `build/` folder to your hosting service.

## 🧪 Testing

Run tests with:
```bash
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com/) for the backend-as-a-service
- [React QR Code](https://github.com/zpao/qrcode.react) for QR generation
- [date-fns](https://date-fns.org/) for date manipulation
- [React Toastify](https://fkhadra.github.io/react-toastify/) for notifications

## 📞 Support

For support, email ichandanmsr@gmail.com or create an issue in the GitHub repository.

---

<div align="center">
Made with ❤️ by chandanmsr
</div>
