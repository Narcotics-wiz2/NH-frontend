# Nyodera Heights - Backend API Setup

This guide explains how to create a separate backend API repository and deploy it to Render.

## Overview

The Nyodera Heights project is currently monolithic with both frontend and backend in one repository. This causes issues when deployed to Render because Render tries to serve the entire site as an API backend.

**Solution:** Create a separate backend-only repository to deploy to Render.

## Architecture

```
Frontend (GitHub Pages)
├── index.html
├── login.html
├── script.js
└── styles.css
↓ API calls to ↓
Backend API (Render)
├── /api/auth/login
├── /api/auth/signup
├── /api/bookings
└── ... other endpoints
```

## Step 1: Create New Backend Repository

1. Go to https://github.com/new
2. Create a new repository named `NH2-Backend` or `nyodera-heights-api`
3. Initialize with a README
4. Make it **Public** (so Render can access it)

## Step 2: Copy Backend Files to New Repository

Copy these files from `Barackjuma/NH2` to your new backend repo:

```
NH2-Backend/
├── server/
│   ├── index.js
│   ├── package.json
│   ├── users.json
│   ├── bookings.json
│   ├── properties.json
│   └── room_services.json
├── .env.example
├── .gitignore
├── Procfile
├── package.json (root level)
└── README.md
```

## Step 3: Backend Repository Structure

Your new backend repository should look like:

```
NH2-Backend/
├── index.js (copy from server/index.js)
├── package.json (copy from server/package.json)
├── .env.example
├── .gitignore
├── Procfile (web: node index.js)
├── README.md
├── users.json
├── bookings.json
├── properties.json
├── room_services.json
└── (no HTML files!)
```

### Root package.json

```json
{
  "name": "nyodera-heights-api",
  "version": "1.0.0",
  "description": "Nyodera Heights Backend API",
  "main": "index.js",
  "license": "MIT",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "@paypal/checkout-server-sdk": "^1.0.3",
    "axios": "^1.16.1",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "nodemailer": "^6.9.4",
    "stripe": "^12.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.14"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
```

### Procfile

```
web: node index.js
```

### .gitignore

```
node_modules/
.env
.env.local
*.log
.DS_Store
```

## Step 4: Deploy to Render

1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Connect your GitHub account and select `NH2-Backend` repository
4. Configure:
   - **Name:** `nyodera-heights-api` (or similar)
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
5. Add Environment Variables (from `.env.example`):
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `PAYPAL_CLIENT_ID`
   - `PAYPAL_CLIENT_SECRET`
   - `MPESA_CONSUMER_KEY` (optional)
   - `MPESA_CONSUMER_SECRET` (optional)
   - `PORT=4242`
6. Click **Create Web Service**

Render will assign you a URL like: `https://nyodera-heights-api.onrender.com`

## Step 5: Update Frontend Configuration

In your frontend repository (`Barackjuma/NH2`), update `script.js`:

```javascript
// Change from:
window.PAYMENTS_SERVER = 'https://nyoderahomes-backend.onrender.com';

// To:
window.PAYMENTS_SERVER = 'https://your-new-backend-url.onrender.com';
```

## Step 6: Test the API

After deployment, test that the API is working:

```bash
curl https://your-backend-url.onrender.com/health
# Should return: { "status": "ok", "message": "Nyodera Heights API backend is running" }
```

## Important Notes

1. **NO HTML FILES** in the backend repo - it's API only
2. The backend repo should NOT have the Procfile pointing to `server/` subdirectory
3. Move `server/index.js` to root-level `index.js`
4. Move `server/package.json` to root-level `package.json`
5. Keep data files (users.json, bookings.json, etc.) at root level
6. The frontend will continue to be served by GitHub Pages
7. The backend will be served by Render

## CORS Configuration

The backend already has CORS enabled for all origins:

```javascript
app.use(cors());
```

This is fine for development/testing. For production, you might want to restrict it:

```javascript
app.use(cors({
  origin: 'https://barackjuma.github.io',
  credentials: true
}));
```

## Data Persistence

The current implementation stores data in JSON files at the root directory:
- `users.json`
- `bookings.json`
- `properties.json`
- `room_services.json`

**Note:** On Render's free tier, data is NOT persistent between deployments. For production, consider:
- Using a database (MongoDB, PostgreSQL, etc.)
- Using Render's persistent disks
- Using an external storage service

## Troubleshooting

### "Cannot find module 'express'"
Run: `npm install` in the backend repository root

### "CORS error when calling API"
Make sure the frontend URL matches the API's CORS configuration

### "404 on /api/auth/login"
Ensure the backend is running and the URL in script.js is correct

### "Data not persisting"
Use a database instead of JSON files for production

## Next Steps

1. Create the new backend repository
2. Copy the files from `server/` directory
3. Deploy to Render
4. Update the frontend to point to the new backend URL
5. Test the login flow

For more help, see:
- Render Documentation: https://render.com/docs
- Express.js: https://expressjs.com/
