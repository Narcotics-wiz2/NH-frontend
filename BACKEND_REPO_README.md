# NH2 Backend - Quick Start for New Repository

This file contains the exact content to put in your new backend repository.

## Files to Create in New Repo

### 1. index.js (root level)
Copy the entire content from `server/index.js` in the frontend repository.

### 2. package.json (root level)
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

### 3. Procfile
```
web: node index.js
```

### 4. .env.example
Copy from the frontend repo's `server/.env.example`

### 5. .gitignore
```
node_modules/
.env
.env.local
.DS_Store
*.log
npm-debug.log*
```

### 6. README.md
```markdown
# Nyodera Heights API Backend

This is the backend API for the Nyodera Heights property management system.

## Setup

1. Clone the repository
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in your values
4. Run `npm start`

The API will be available at `http://localhost:4242`

## API Endpoints

- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user details
- `POST /api/bookings` - Create a booking
- `GET /api/bookings` - Get all bookings
- `GET /api/properties` - Get all properties

## Environment Variables

See `.env.example` for required variables.
```

### 7. Data Files (empty initially, will be created on first run)

Create these empty JSON files at root level:

**users.json**
```json
[]
```

**bookings.json**
```json
[]
```

**properties.json**
```json
[
  {
    "id": "1",
    "title": "Luxury Studio Apartment",
    "rate_per_month": 2500,
    "location": "Downtown District"
  },
  {
    "id": "2",
    "title": "Elegant One Bedroom",
    "rate_per_month": 3200,
    "location": "Midtown Elegance"
  },
  {
    "id": "3",
    "title": "Premium Two Bedroom",
    "rate_per_month": 4500,
    "location": "Highrise Avenue"
  },
  {
    "id": "4",
    "title": "Luxury Two Bedroom Penthouse",
    "rate_per_month": 5800,
    "location": "Waterfront Plaza"
  },
  {
    "id": "5",
    "title": "Spacious Three Bedroom",
    "rate_per_month": 6500,
    "location": "Uptown Heights"
  },
  {
    "id": "6",
    "title": "Modern Studio with Balcony",
    "rate_per_month": 2800,
    "location": "Downtown District"
  }
]
```

**room_services.json**
```json
[]
```

## Deployment to Render

1. Push this repository to GitHub
2. Go to https://dashboard.render.com
3. Create a new Web Service
4. Select this repository
5. Set Build Command: `npm install`
6. Set Start Command: `node index.js`
7. Add environment variables from `.env.example`
8. Deploy

## Frontend Configuration

Update the frontend's `script.js` to point to your deployed backend URL:

```javascript
window.PAYMENTS_SERVER = 'https://your-backend-url.onrender.com';
```
