# Payment Integration Setup Guide

This document covers setup instructions for the PCI-compliant payment providers integrated into Nyodera Heights.

## Supported Payment Methods

1. **Stripe** - Card payments (PCI-compliant)
2. **PayPal** - Digital wallet (PCI-compliant)
3. **M-Pesa** - Mobile money (Africa-focused)

---

## 1. Stripe Setup

Stripe handles card payments in a fully PCI-compliant manner.

### Prerequisites
- Stripe account (https://stripe.com)

### Configuration

#### Get Your Keys
1. Log into Stripe Dashboard
2. Navigate to **Developers > API Keys**
3. Copy your test keys:
   - **Publishable Key** (starts with `pk_test_`)
   - **Secret Key** (starts with `sk_test_`)

#### Update `.env` File
```bash
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
```

#### Server Endpoint
- **POST** `/create-checkout-session`
  - Accepts: `{ amount, currency }`
  - Returns: Stripe checkout session ID
  - Handles card payment processing through Stripe's secure checkout

#### Client Integration
- Stripe.js is loaded via CDN
- `Pay with Stripe` button redirects to Stripe's hosted checkout
- Payment results are validated server-side

---

## 2. PayPal Setup

PayPal provides digital wallet payments (PCI-compliant).

### Prerequisites
- PayPal Developer Account (https://developer.paypal.com)

### Configuration

#### Get Your Credentials
1. Log into PayPal Developer Console
2. Navigate to **Apps & Credentials**
3. Create or select a Sandbox application
4. Copy:
   - **Client ID**
   - **Secret**

#### Update `.env` File
```bash
PAYPAL_CLIENT_ID=sb_YOUR_CLIENT_ID
PAYPAL_CLIENT_SECRET=YOUR_CLIENT_SECRET
```

#### Server Endpoint
- **POST** `/create-paypal-order`
  - Accepts: `{ amount, currency }`
  - Returns: PayPal order ID
  - Handles order creation in PayPal sandbox

#### Client Integration
- PayPal SDK is dynamically loaded
- `PayPal Buttons` render on the payment page
- `onApprove` callback captures the payment

---

## 3. M-Pesa Setup

M-Pesa provides mobile money payments (SMS-based, no internet required).

### Prerequisites
- M-Pesa merchant account or API integration
  - **Option A**: Safaricom (https://developer.safaricom.co.ke)
  - **Option B**: Flutterwave (https://flutterwave.com)
  - **Option C**: Daraja (MPesa API)

### Configuration

For production integration:

#### Safaricom Daraja API
```bash
MPESA_CONSUMER_KEY=eA8zUSwLapKDTbnP0geX1Dej7AYGIWp5KJNC162WpVnHV8Th
MPESA_CONSUMER_SECRET=DLAi1uH2B06VYC7qbuR9FqA4n2EgC8wuTAvsaoLlb06AAbulEGMyjS5ZrCKu86gb
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
```

#### Update Server Code
Replace the simulated endpoint in `/server/index.js` with actual M-Pesa API calls:

```javascript
app.post('/create-mpesa-payment', async (req, res) => {
  try {
    const { amount, phone } = req.body;
    
    // Call actual M-Pesa API
    const response = await mpesaClient.initiateSTKPush({
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: generatePassword(),
      Timestamp: getTimestamp(),
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: 'https://yourdomain.com/mpesa-callback',
      AccountReference: 'Nyodera Heights',
      TransactionDesc: 'Property Payment'
    });
    
    res.json({ success: true, transaction: response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

#### Client Integration
- Phone number field accepts numbers with or without country code
- Transactions validated server-side
- Transaction ID provided to user

---

## Security Best Practices

✅ **DO**
- Use HTTPS in production
- Store API keys in `.env` (never commit to git)
- Validate amounts and phone numbers server-side
- Use Stripe/PayPal hosted checkout (avoids direct card handling)
- Log transactions for audit trails

❌ **DON'T**
- Store card details in the database
- Pass sensitive data through query parameters
- Use test keys in production
- Expose secret keys to the frontend

---

## Testing

### Test Card Numbers (Stripe)
- **Visa**: 4242 4242 4242 4242
- **Mastercard**: 5555 5555 5555 4444
- **Amex**: 3782 822463 10005

### Test M-Pesa Number
- **Format**: +254712345678 or 254712345678

### Environment
The app runs on:
- **Frontend**: `http://localhost:5500`
- **Backend**: `http://localhost:4242`

---

## 4. Email Configuration (Optional)

Nyodera Heights can send transactional emails (password resets, OTPs, receipts). The server supports multiple delivery methods: a provider HTTP API (recommended), a generic API adapter, or SMTP.

Add email settings to your local `.env` (see `.env.example`). Important variables:

- `EMAIL_PROVIDER` — provider identifier (e.g. `unione`).
- `EMAIL_API_URL` and `EMAIL_API_KEY` — for provider HTTP APIs.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — for SMTP.
- `EMAIL_FROM` — default From header.
- `EMAIL_ENVELOPE_FROM` — SMTP/envelope-from address (used for bounce handling).
- `EMAIL_SENDING_DOMAIN` — the verified sending domain for your provider.
- `CONFIRMED_SENDING_ADDRESS` — the confirmed sender address for account verification.

Example (see `.env.example`):

```
EMAIL_SENDING_DOMAIN=sandbox-7150788-12ba29.unionemailer.com
CONFIRMED_SENDING_ADDRESS=barackjuma911@gmail.com
```

Do not commit your real `.env` file. Keep API keys and SMTP credentials private.


## Troubleshooting

| Issue | Solution |
|-------|----------|
| Stripe keys not loading | Check `.env` file in `/server` folder |
| PayPal button not appearing | Ensure `PAYPAL_CLIENT_ID` is set |
| M-Pesa payment fails | Verify phone number format and server URL |
| CORS errors | Ensure backend server is running on port 4242 |

---

## Production Checklist

- [ ] Replace test keys with live API keys
- [ ] Update HTTPS URLs in success/cancel redirects
- [ ] Implement webhook handlers for payment notifications
- [ ] Add email receipts for users
- [ ] Set up fraud detection (Stripe Radar, PayPal Risk Tools)
- [ ] Enable 3D Secure for card payments
- [ ] Test with real transactions
- [ ] Set up monitoring/alerts for payment failures
- [ ] Document refund procedures

