# iAqualink Spa Control - Backend

A Node.js/Express backend API server that interfaces with the iAqualink cloud service to control spa equipment.

## Features

- **Authentication**: Secure iAqualink cloud API authentication
- **Session Management**: Automatic session refresh and token management
- **Spa Controls**: API endpoints for spa mode, heater, and jet pump control
- **Temperature Monitoring**: Real-time temperature data retrieval
- **Error Handling**: Comprehensive error handling and logging
- **Rate Limiting**: Built-in rate limiting for API protection
- **CORS**: Configurable CORS for frontend integration
- **Scheduled Shutdown**: Cron job turns off all equipment nightly at 12 AM Pacific
- **Auto Shutdown**: Spa turns off automatically 3 hours after activation
- **Geo Restriction**: Location checks to restrict access

## API Endpoints

### GET /api/status
Returns current spa status including temperatures and device states.

**Response:**
```json
{
  "airTemp": 78,
  "spaTemp": 102,
  "poolTemp": 84,
  "spaMode": true,
  "spaHeater": false,
  "jetPump": true,
  "connected": true,
  "lastUpdate": "2024-01-15T10:30:00.000Z"
}
```

### POST /api/toggle/:device
Toggles a spa device on/off.

**Devices:**
- `spa-mode` - Toggle spa mode
- `spa-heater` - Toggle spa heater
- `jet-pump` - Toggle jet pump

**Response:**
```json
{
  "success": true,
  "device": "spa-heater",
  "message": "spa-heater toggled successfully"
}
```

### GET /api/devices
Returns information about available devices.

### GET /api/aux-status
Returns current AUX circuit states including labels.

### GET /health
Health check endpoint.

### POST /api/shutdown
Turns off all equipment. Useful for external schedulers.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create environment file:
   ```bash
   cp .env.example .env
   ```

3. Configure environment variables in `.env`:
   ```
   IAQUALINK_USERNAME=your.email@example.com
   IAQUALINK_PASSWORD=your_password
   PORT=3001
   CORS_ORIGIN=http://localhost:3000
   ACCESS_KEY=mysecret
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

## Environment Variables

### Required
- `IAQUALINK_USERNAME`: Your iAqualink account email
- `IAQUALINK_PASSWORD`: Your iAqualink account password
- `ACCESS_KEY`: Secret key required in `x-access-key` header for all API requests

### Optional
- `IAQUALINK_DEVICE_ID`: Specific device serial (if multiple devices)
- `PORT`: Server port (default: 3001)
- `CORS_ORIGIN`: Frontend URL for CORS (default: http://localhost:3000)
- `SESSION_TIMEOUT`: Session timeout in milliseconds (default: 43200000)
- `JET_PUMP_COMMAND`: Device command for the spa jets (default: `aux_4`)
- `HEARTBEAT_URL`: Optional URL pinged every 14 minutes to keep the service awake
### Render Cron Setup
On Render's free tier the service sleeps after 15 minutes. Configure Render Cron jobs:
1. **Heartbeat** – GET `/health` every 14 minutes to keep the service awake.
2. **Nightly shutdown** – POST `/api/shutdown` at **12:05 AM America/Los_Angeles**.
The backend also schedules an automatic shutdown three hours after the spa is turned on, so cron is only needed for the nightly cutoff and keeping the service awake.




## Deployment Options

### 1. Fly.io Deployment

1. Install Fly CLI: https://fly.io/docs/getting-started/installing-flyctl/

2. Create fly.toml:
   ```toml
   app = "your-app-name"

   [build]

   [env]
   NODE_ENV = "production"
   PORT = "8080"

   [[services]]
   internal_port = 8080
   protocol = "tcp"

   [[services.ports]]
   handlers = ["http"]
   port = 80

   [[services.ports]]
   handlers = ["tls", "http"]
   port = 443
   ```

3. Deploy:
   ```bash
   fly deploy
   fly secrets set IAQUALINK_USERNAME=your.email@example.com
   fly secrets set IAQUALINK_PASSWORD=your_password
   ```

### 2. Railway Deployment

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on git push

### 3. Render Deployment

1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy automatically on git push

## Error Handling

The API returns standardized error responses:

```json
{
  "error": "Error message",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/status",
  "method": "GET"
}
```

## Rate Limiting

- 100 requests per 15 minutes per IP address
- Returns 429 status code when exceeded

## Security Features

- Helmet.js for security headers
- Rate limiting
- Input validation
- CORS protection
- Environment variable validation

## File Structure

```
backend/
├── src/
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── routes/
│   │   └── spa.js
│   ├── services/
│   │   └── iaqualink.js
│   └── server.js
├── .env.example
├── package.json
└── README.md
```

## Troubleshooting

### Common Issues

1. **Authentication fails**: Check username/password in .env
2. **Device not found**: Verify device is online in iAqualink app
3. **Session timeout**: Service automatically refreshes sessions
4. **CORS errors**: Update CORS_ORIGIN in environment variables

### Logs

The server logs all important events:
- ✅ Login success
- ❌ Login failure
- 📱 Device selection
- 📊 Status retrieval
- 🔄 Device toggles

## Support

For issues related to:
- iAqualink API changes: Check for updates
- Device compatibility: Verify device is supported
- Network issues: Check internet connectivity
