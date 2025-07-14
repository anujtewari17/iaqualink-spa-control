# iAquaLink 2.0 Simplified Spa Control

A minimal, secure web application for controlling **only the essential spa functions** of your iAquaLink 2.0 system.

## What This Shows

This simplified version exposes **only these controls**:
- **Spa Mode** - Toggle spa/pool valve positions
- **Spa Heat** - Turn spa heater on/off
- **Filter Pump** - Control circulation pump
- **Temperature** - View current temp and adjust target temp

**Everything else is hidden** - no pool controls, no auxiliary devices, no complex features.

## Features

- **Secure Login** - Uses your existing iAquaLink email/password
- **Kiosk Ready** - Tablet-optimized interface for dedicated spa control
- **Auto-refresh** - Updates spa status every 30 seconds
- **Session Management** - Secure token handling with automatic logout
- **CORS Proxy** - Built-in serverless proxy for browser compatibility

## Quick Deploy to Vercel

1. **Upload these files** to a new GitHub repository
2. **Go to [vercel.com](https://vercel.com)** and sign up with GitHub (free)
3. **Click "New Project"** and import your repository
4. **Click "Deploy"** - no configuration needed!
5. **Get your live URL** (e.g., `https://spa-control.vercel.app`)

## Usage

1. **Send the URL** to your property manager
2. **Give them your iAquaLink email and password**
3. **They open the URL** on iPad/tablet
4. **Login once** and get immediate spa control
5. **Enable iPad Guided Access** for kiosk mode

## iPad Kiosk Setup

1. **Settings** → **Accessibility** → **Guided Access**
2. **Enable** and set a secure passcode
3. **Open spa control URL** in Safari
4. **Add to Home Screen** for full-screen experience
5. **Triple-click home button** to start Guided Access
6. **iPad is now locked** to spa control only

## Security Features

- **No credentials stored** in code or environment variables
- **Session-based authentication** (expires when tab closes)
- **Automatic logout** for security
- **CORS protection** and secure headers
- **HTTPS enforced** by Vercel

## What's Different from Full Version

| Feature | Full Version | Simplified Version |
|---------|--------------|-------------------|
| Pool controls | ✅ | ❌ Hidden |
| Auxiliary devices | ✅ | ❌ Hidden |
| OneTouch scenes | ✅ | ❌ Hidden |
| Lights/Colors | ✅ | ❌ Hidden |
| Scheduling | ✅ | ❌ Hidden |
| Spa essentials | ✅ | ✅ **Only these** |

## File Structure

```
/
├── api/
│   └── proxy.js          # Serverless CORS proxy
├── public/
│   ├── index.html        # Minimal spa control interface
│   ├── app.js            # Simplified control logic
│   └── styles.css        # Clean, tablet-friendly styling
├── vercel.json           # Vercel deployment config
├── package.json          # Node.js dependencies
└── README.md             # This file
```

## Troubleshooting

### "Failed to login"
- Double-check iAquaLink email and password
- Try logging into official iAquaLink app first
- Ensure iAquaLink 2.0 device has green LED (connected)

### "No devices found"
- Check that iAquaLink 2.0 device is online
- Verify device is added to your iAquaLink account
- Try refreshing the page

### "Connection Error"
- Check iPad/tablet internet connection
- Try refreshing the page
- Logout and login again

## Browser Compatibility

- ✅ Safari (iPad/iPhone) - Recommended
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Edge 80+

## Free Hosting

Both Vercel and Netlify provide:
- ✅ 100GB bandwidth/month
- ✅ 125,000 function calls/month
- ✅ Automatic SSL certificates
- ✅ Custom domains

More than sufficient for personal spa control use.

## Support

This is a simplified version focused on core spa functionality. For full pool automation features, use the complete iAquaLink app.

## License

MIT License - Feel free to modify for your needs.