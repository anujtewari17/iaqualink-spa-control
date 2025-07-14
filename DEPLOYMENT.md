# Quick Deployment Guide

## 5-Minute Setup

### Step 1: Upload to GitHub
1. Create a new **public repository** on GitHub
2. Upload all files from this folder to the repository
3. Make sure the repository is public (required for free hosting)

### Step 2: Deploy to Vercel
1. Go to **[vercel.com](https://vercel.com)**
2. Sign up with your GitHub account (free)
3. Click **"New Project"**
4. Import your GitHub repository
5. Click **"Deploy"** (no configuration needed)
6. Get your live URL (e.g., `https://spa-control.vercel.app`)

### Step 3: Share with Property Manager
Send them:
- **Live URL** from Vercel
- **iAquaLink email and password** (their existing credentials)
- **Instructions**: "Open the URL on your iPad, login with your iAquaLink credentials, and enable Guided Access for kiosk mode"

## iPad Kiosk Setup

### Enable Guided Access
1. **Settings** → **Accessibility** → **Guided Access**
2. Turn on **Guided Access**
3. Set a **passcode** (remember this!)
4. Turn on **Accessibility Shortcut**

### Lock to Spa Control App
1. Open your spa control URL in Safari
2. Add to home screen: Share button → "Add to Home Screen"
3. Open the home screen app
4. **Triple-click the home button** to start Guided Access
5. Configure disabled areas (optional)
6. Tap **Start** in the top right

### Exit Kiosk Mode
- **Triple-click home button** → Enter your passcode → End

## Alternative: Deploy to Netlify

1. Go to **[netlify.com](https://netlify.com)**
2. Sign up with your GitHub account (free)
3. Click **"New site from Git"**
4. Choose your GitHub repository
5. Click **"Deploy site"** (no configuration needed)
6. Get your live URL (e.g., `https://spa-control.netlify.app`)

## What Your Property Manager Gets

- **Simple URL** to bookmark
- **One-time login** with existing iAquaLink credentials
- **Immediate spa control** with professional interface
- **No technical setup** required
- **Works on any tablet** or phone

## Troubleshooting

### "Failed to login"
- Verify iAquaLink credentials work in official app
- Check iAquaLink 2.0 device has green LED
- Try refreshing the page

### "No devices found"
- Ensure iAquaLink 2.0 device is online
- Verify system is added to iAquaLink account
- Wait 30 seconds and try again

### "Connection Error"
- Check internet connection
- Try different browser
- Logout and login again

## Security Notes

- **No credentials stored** anywhere in the code
- **Session expires** when browser tab closes
- **Automatic logout** for security
- **HTTPS enforced** by hosting platform
- **CORS protection** built-in

## Success Checklist

✅ Repository uploaded to GitHub  
✅ Deployed to Vercel/Netlify  
✅ Live URL working  
✅ Login successful with iAquaLink credentials  
✅ Spa controls visible and functional  
✅ iPad configured in Guided Access  
✅ URL shared with property manager  

**You're done!** The spa control system is ready for use.