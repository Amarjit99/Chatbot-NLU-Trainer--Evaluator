# Google reCAPTCHA Setup Guide

## Overview
Google reCAPTCHA has been integrated into the login and signup pages to protect against bots and automated attacks.

## Getting Your reCAPTCHA Keys

1. **Go to Google reCAPTCHA Admin Console**
   - Visit: https://www.google.com/recaptcha/admin/create
   - Sign in with your Google account

2. **Create a New Site**
   - **Label**: Enter a label for your site (e.g., "Chatbot NLU Trainer")
   - **reCAPTCHA type**: Select **reCAPTCHA v2** → **"I'm not a robot" Checkbox**
   - **Domains**: 
     - For development: Add `localhost`
     - For production: Add your domain name (e.g., `yourdomain.com`)
   - Accept the reCAPTCHA Terms of Service
   - Click **Submit**

3. **Copy Your Keys**
   After submitting, you'll receive two keys:
   - **Site Key** (used in frontend)
   - **Secret Key** (used in backend)

## Configuration

### Frontend Configuration

1. Open `frontend/src/config/recaptcha.js`
2. Replace the test site key with your actual site key:

```javascript
export const RECAPTCHA_SITE_KEY = 'your-actual-site-key-here';
```

### Backend Configuration

1. Create or update `.env` file in the `backend` directory:

```env
# Google reCAPTCHA
RECAPTCHA_SECRET_KEY=your-secret-key-here

# Optional: Skip reCAPTCHA verification in development
# SKIP_RECAPTCHA=true
```

2. **Never commit your `.env` file** to version control

## Test Keys (Already Configured)

The application comes pre-configured with Google's test keys for development:

- **Site Key**: `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`
- **Secret Key**: `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`

**Note**: These test keys will always pass validation. Replace them with real keys for production!

## Testing

### With Test Keys
- The reCAPTCHA widget will appear with a warning "This site is not registered with reCAPTCHA"
- All verifications will pass automatically
- Perfect for development and testing

### With Real Keys
- The reCAPTCHA widget will function normally
- Users must complete the challenge
- Bot protection is active

## Features

✅ **Login Page Protection**: Users must complete reCAPTCHA before logging in
✅ **Signup Page Protection**: Users must complete reCAPTCHA before creating an account
✅ **Token Reset on Error**: reCAPTCHA resets automatically if login/signup fails
✅ **Disabled Submit Button**: Submit button is disabled until reCAPTCHA is completed
✅ **Backend Verification**: Server-side verification of reCAPTCHA tokens
✅ **Development Mode**: Optional bypass for development (set `SKIP_RECAPTCHA=true`)

## Troubleshooting

### reCAPTCHA Not Showing
- Check your internet connection
- Verify the site key is correct in `frontend/src/config/recaptcha.js`
- Check browser console for errors

### "Invalid site key" Error
- Make sure you're using the Site Key (not Secret Key) in the frontend
- Verify the domain is registered in reCAPTCHA admin console

### Verification Always Fails
- Check that the Secret Key is correct in backend `.env`
- Ensure backend can reach `https://www.google.com/recaptcha/api/siteverify`
- Check backend console logs for error details

### Development Bypass
If you want to skip reCAPTCHA during development, add to backend `.env`:
```env
SKIP_RECAPTCHA=true
```

## Security Best Practices

1. **Never expose your Secret Key** - Keep it only on the server
2. **Use environment variables** for both keys in production
3. **Add your production domain** to the reCAPTCHA admin console
4. **Don't commit `.env` files** to version control
5. **Replace test keys** before deploying to production
6. **Monitor reCAPTCHA analytics** in the admin console

## Support

For more information, visit:
- [reCAPTCHA Documentation](https://developers.google.com/recaptcha/intro)
- [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
