# iAqualink Spa Control

This project provides a simple guest-facing web interface to control spa features using the iAqualink API. It is intended to be deployed on Netlify and displayed on an iPad in Guided Access mode.

## Features

 - Login page collects your iAqualink credentials
- Displays current Air, Pool and Spa temperatures
- Allows toggling of **Spa Mode**, **Spa Heater**, and **Jet Pump** only
- All other pool equipment is hidden

## Folder Structure

- `frontend/` – React application built with Vite
- `netlify/functions/` – Serverless functions that proxy requests to the iAqualink API
- `.env.example` – Example environment variables
- `netlify.toml` – Netlify build configuration

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your device serial number.
3. Run locally with Netlify CLI:
   ```bash
   npx netlify dev
   ```

When deploying to Netlify, add the same environment variable (the device serial) through the Netlify dashboard.

## Building

The build step runs `npm run build` which builds the React app into `frontend/dist`. Netlify will automatically deploy the built site along with the serverless functions.

## Usage

After deployment, open the Netlify URL on an iPad in Safari. Enable Guided Access to restrict user access. Guests will see only the spa controls and current temperatures.
The first time you access the app, you'll be prompted to log in with your iAqualink credentials. These are never stored in the repository.
