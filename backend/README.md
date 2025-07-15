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

### GET /health
Health check endpoint.

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
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

## Environment Variables

### Required
- `IAQUALINK_USERNAME`: Your iAqualink account email
- `IAQUALINK_PASSWORD`: Your iAqualink account password

### Optional
- `IAQUALINK_DEVICE_ID`: Specific device serial (if multiple devices)
- `PORT`: Server port (default: 3001)
- `CORS_ORIGIN`: Frontend URL for CORS (default: http://localhost:3000)
- `SESSION_TIMEOUT`: Session timeout in milliseconds (default: 43200000)

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
