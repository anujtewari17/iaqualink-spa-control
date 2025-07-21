# iAqualink Spa Control - Frontend

A React-based frontend application for controlling spa features via iAqualink API.

## Features

- **Spa Controls**: Toggle buttons for Spa (mode + heat) and Jet Pump
- **iPad Optimized**: Touch-friendly interface designed for iPad Safari
- **Auto-refresh**: Status updates every 5 seconds

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create environment file:
   ```bash
   cp .env.example .env
   ```

3. Configure backend URL in `.env`:
   ```
   VITE_BACKEND_URL=http://localhost:3001
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## Building for Production

Build static files for GitHub Pages:
```bash
npm run build
```

The built files will be in the `dist` directory.

To rebuild the app and copy the output to the repository `docs/` folder, run:
```bash
npm run deploy
```

## GitHub Pages Deployment

1. Push your code to GitHub
2. Go to repository Settings > Pages
3. Set source to "Deploy from a branch"
4. Select main branch and `/dist` folder (after building)
5. Your app will be available at `https://username.github.io/repository-name/`

## Environment Variables

- `VITE_BACKEND_URL`: URL of the backend API server

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Optimized for iPad Safari in Guided Access mode
- Touch-friendly interface with 44px+ touch targets

## File Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Login.jsx
│   │   └── SpaControls.jsx
│   ├── services/
│   │   └── spaAPI.js
│   ├── styles/
│   │   └── main.css
│   ├── App.jsx
│   └── main.jsx
├── public/
├── .env.example
├── index.html
├── package.json
└── vite.config.js
```
