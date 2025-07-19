# iAqualink Spa Control - Guest Panel

A complete web application for controlling iAqualink spa features, designed for guest access on iPad devices in guided access mode.

## 🚀 Quick Start

This project consists of two parts:
1. **Frontend**: React app (hosted on GitHub Pages)
2. **Backend**: Node.js API server (deployed on Fly.io, Railway, or Render)

### 1. Deploy Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your iAqualink credentials
npm run dev
```

### 2. Deploy Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your backend URL
npm run build
```

## 📦 What's Included

### Frontend (React + Vite)
- 🎛️ **Spa Controls**: Toggle buttons for Spa (mode + heat) and jet pump
- 📱 **iPad Optimized**: Touch-friendly interface for guided access
- 🔄 **Auto-refresh**: Status updates every 5 seconds

### Backend (Node.js + Express)
- 🔐 **Authentication**: Secure iAqualink API integration
- 🛡️ **Session Management**: Automatic token refresh
- 🌊 **Spa API**: RESTful endpoints for spa control
- 📊 **Status Monitoring**: Real-time temperature and device status
- 🚦 **Rate Limiting**: Built-in API protection
- 🔗 **CORS**: Configurable cross-origin support

## 🛠️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   iPad Safari   │───▶│  React Frontend │───▶│ Node.js Backend │
│ (Guided Access) │    │ (GitHub Pages)  │    │ (Fly.io/Railway)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                              ┌─────────────────┐
                                              │ iAqualink Cloud │
                                              │      API        │
                                              └─────────────────┘
```

## 🔧 Deployment Guide

### Backend Deployment (Choose One)

#### Option 1: Fly.io
```bash
cd backend
fly deploy
fly secrets set IAQUALINK_USERNAME=your.email@example.com
fly secrets set IAQUALINK_PASSWORD=your_password
```

#### Option 2: Railway
1. Connect GitHub repo to Railway
2. Set environment variables in dashboard
3. Deploy automatically

#### Option 3: Render
1. Connect GitHub repo to Render
2. Set environment variables in dashboard
3. Deploy automatically

### Frontend Deployment (GitHub Pages)

1. **Build the frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add spa control app"
   git push origin main
   ```

3. **Enable GitHub Pages:**
   - Go to repository Settings > Pages
   - Source: "Deploy from a branch"
   - Branch: main, folder: /frontend/dist

4. **Update environment:**
   ```bash
   # In frontend/.env
   VITE_BACKEND_URL=https://your-backend-url.fly.dev
   ```

## 📝 Configuration

### Backend Environment Variables
```bash
# Required
IAQUALINK_USERNAME=your.email@example.com
IAQUALINK_PASSWORD=your_password

# Optional
IAQUALINK_DEVICE_ID=device_serial_if_multiple
PORT=3001
# URL the frontend is served from
CORS_ORIGIN=https://username.github.io
# Set to the AUX circuit number that controls your jets (e.g. aux_4)
JET_PUMP_COMMAND=aux_4
# Semicolon separated latitude,longitude coordinates allowed to use the app
ALLOWED_LOCATIONS=37.7749,-122.4194;34.0522,-118.2437
# Optional URL to ping every 14 minutes to keep the backend awake
HEARTBEAT_URL=

```


### Frontend Environment Variables
```bash
# Required
VITE_BACKEND_URL=https://your-backend-url.fly.dev
```

## 🔐 Security Features

- **No credentials in frontend**: All authentication handled server-side
- **CORS protection**: Configurable origin restrictions
- **Rate limiting**: 100 requests per 15 minutes
- **Input validation**: Sanitized API parameters
- **Session management**: Automatic token refresh
- **Location checks**: Optional geo restriction for frontend access
- **Nightly shutdown**: Cron job turns off equipment at midnight
- **Render cron**: Scheduled jobs keep the free-tier backend awake

### Render Cron Setup
Render free services fall asleep after 15 minutes. Configure Render Cron jobs to:
1. **Heartbeat** – GET `/health` every 14 minutes to keep the service awake.
2. **Nightly shutdown** – POST `/api/shutdown` at **12:05 AM America/Los_Angeles**.

## 📱 iPad Setup for Guests

### 1. Enable Guided Access
- Settings > Accessibility > Guided Access
- Turn on Guided Access
- Set a passcode your team knows

### 2. Launch the App
- Open Safari
- Navigate to your GitHub Pages URL
- Add to Home Screen (optional)

### 3. Activate Guided Access
- Triple-click home button (or side button)
- Select areas to disable (optional)
- Start Guided Access

### 4. Guest Instructions
Simple signage for guests:
```
🌊 SPA CONTROL

Available Controls:
• Spa - Turn on/off (mode + heat)
• Jet Pump - Activate jets

Notes:
• Spa must be ON to use jets
• Updates appear within a few seconds

```

## 🎯 Features

### ✅ Spa Controls
- [x] Spa (mode + heat) toggle
- [x] Jet Pump control

### ✅ Safety Features
- [x] Guest-safe interface
- [x] No access to pool controls
- [x] No system settings access
- [x] Automatic session management

### ✅ User Experience
- [x] iPad-optimized design
- [x] Touch-friendly controls (44px+ targets)
- [x] Visual feedback
- [x] Auto-refresh functionality

## 🚨 Troubleshooting

### Common Issues

1. **Backend won't start**
   - Check .env file exists and has credentials
   - Verify iAqualink credentials work in official app

2. **Frontend can't connect**
   - Check VITE_BACKEND_URL in .env
   - Verify backend is running and accessible
   - Check CORS settings in backend

3. **Authentication fails**
   - Verify iAqualink username/password
   - Check account has active devices
   - Confirm device is online in iAqualink app

4. **Device toggles don't work**
   - Check device is online
   - Verify device supports spa controls
   - Check backend logs for error messages

### Getting Help

1. Check backend logs for error messages
2. Test API endpoints directly:
   ```bash
   curl https://your-backend-url.fly.dev/api/status
   ```
3. Verify iAqualink credentials in official app

## 📄 License

This project is provided as-is for educational and personal use. iAqualink is a trademark of Zodiac Pool Systems.

## 🤝 Contributing

This is a demonstration project. For production use, consider:
- Adding authentication for the frontend
- Implementing device discovery
- Adding more comprehensive error handling
- Adding logging and monitoring
- Implementing device scheduling features

## 📞 Support

For technical issues:
1. Check the README files in `/frontend` and `/backend`
2. Review the API documentation
3. Check deployment platform documentation
4. Verify iAqualink account status

---

**Ready to deploy?** Start with the backend, then the frontend, then set up your iPad!
