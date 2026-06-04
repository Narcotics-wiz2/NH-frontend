# Nyodera Heights API Backend

The backend API server for the Nyodera Heights property management system.

## Overview

This is a standalone Express.js API server that handles:
- User authentication (signup, login, email verification)
- Booking management
- Property listings
- Payment processing (Stripe, PayPal, M-Pesa)
- Room service requests
- Email notifications

## Architecture

The frontend (HTML/CSS/JS) is served separately via GitHub Pages at `https://barackjuma.github.io/NH2/`

This backend API is served separately and communicates via REST API calls.

## Getting Started

### Prerequisites
- Node.js >= 14.0.0
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Barackjuma/NH2-Backend.git
cd NH2-Backend

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env

# Edit .env with your configuration
nanoproper .env
```

### Running Locally

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:4242`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-otp` - Verify email with OTP
- `POST /api/auth/resend-otp` - Resend verification code
- `POST /api/auth/send-verification` - Send verification email
- `GET /api/auth/me` - Get current user details
- `PATCH /api/auth/password` - Change password

### Bookings
- `GET /api/bookings` - Get all bookings
- `POST /api/bookings` - Create a booking
- `POST /api/bookings/cancel-request` - Request booking cancellation
- `POST /api/bookings/:id/approve-cancellation` - Approve cancellation (admin)
- `POST /api/bookings/:id/deny-cancellation` - Deny cancellation (admin)

### Properties
- `GET /api/properties` - Get all properties
- `PATCH /api/properties/:id` - Update property rate (admin)

### Room Service
- `GET /api/room-service-categories` - Get service categories
- `POST /api/room-service/request` - Request room service
- `GET /api/room-service/booking/:bookingId` - Get booking services
- `PATCH /api/room-service/:id/status` - Update service status (admin)
- `POST /api/room-service/:id/cancel` - Cancel room service

### Payments
- `GET /config` - Get payment configuration
- `POST /create-checkout-session` - Create Stripe checkout session
- `POST /create-paypal-order` - Create PayPal order
- `GET /checkout-session/:id` - Get Stripe session details
- `POST /create-mpesa-payment` - Create M-Pesa payment
- `POST /refund` - Process refund

### Other
- `GET /health` - Health check endpoint
- `POST /send-reset-email` - Send password reset email

## Environment Variables

See `.env.example` for all required environment variables.

### Required for Production
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `PAYPAL_CLIENT_ID` - PayPal client ID
- `PAYPAL_CLIENT_SECRET` - PayPal client secret
- Email configuration (SMTP or API)

### Optional
- M-Pesa credentials (for M-Pesa payment support)

## Data Storage

The current implementation stores data in JSON files:
- `users.json` - User accounts
- `bookings.json` - Booking records
- `properties.json` - Property listings
- `room_services.json` - Room service requests

**Note:** For production, consider migrating to a database (MongoDB, PostgreSQL, etc.)

## Email Configuration

Choose one of these approaches:

### Option A: SMTP
Configure SMTP settings in `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Option B: Email API Provider
Use an email service API (SendGrid, Unione, etc.):
```
EMAIL_API_URL=https://api.unione.example/v1/messages
EMAIL_API_KEY=your_api_key_here
```

### Option C: Test Mode (Default)
If no email provider is configured, the system uses Ethereal (free test account) for testing.

## Deployment

### Deploy to Render

1. Push this repository to GitHub
2. Go to https://dashboard.render.com
3. Create a new Web Service
4. Select this repository
5. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
6. Add environment variables from `.env.example`
7. Click Deploy

Render will assign a URL like: `https://your-service.onrender.com`

### Update Frontend

Update the frontend's `script.js` to use your backend URL:

```javascript
window.PAYMENTS_SERVER = 'https://your-service.onrender.com';
```

## CORS Configuration

The API has CORS enabled for all origins by default. For production, restrict to your frontend URL in `index.js`:

```javascript
app.use(cors({
  origin: 'https://barackjuma.github.io',
  credentials: true
}));
```

## Troubleshooting

### Port Already in Use
Change the PORT in `.env` or use:
```bash
PORT=5000 npm start
```

### Module Not Found
```bash
rm -rf node_modules package-lock.json
npm install
```

### Email Not Sending
Check `.env` email configuration and verify credentials are correct.

### CORS Errors
Ensure the frontend URL is allowed in CORS configuration.

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
