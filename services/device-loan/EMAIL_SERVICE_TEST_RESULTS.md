# Testing Email Service with Auth0

## Summary

Your email service has two main components:
1. **SendGrid** - for actually sending emails ✅ **WORKING**
2. **Auth0** - for fetching user email addresses

## ✅ SendGrid Test Results

SendGrid is configured correctly and sending emails successfully!

```bash
npm run test:sendgrid your-email@example.com
```

## Auth0 User Service

The Auth0 User Service fetches user emails from Auth0's Management API. This requires:

### Prerequisites

1. **Auth0 Management API Access Token** (valid for 24 hours)
2. **Proper Scopes**: The M2M application needs `read:users` scope

### Getting a Fresh Token

```bash
cd services/device-loan
./get-auth0-token.sh "YOUR_CLIENT_SECRET"
```

Your client secret: `rYpI5akQKsx9W6kbOK6HeLujUKnHV1ZKQO6Q_bg9o0fTCXmRtzAJTy1XUz5g8mzp`

### ⚠️ Current Issue

The Management API token needs the `read:users` scope to fetch user information. To fix this:

1. Go to [Auth0 Dashboard](https://manage.auth0.com)
2. Navigate to **Applications** → **Applications**
3. Find your M2M application (`q6zdoS0wgzFPm9190rtNNzqTeCfgY8oi`)
4. Go to **APIs** tab
5. Find **Auth0 Management API**
6. Click **Authorize** and ensure these scopes are enabled:
   - `read:users`
   - `read:user_idp_tokens`
7. Save and generate a new token

### Testing After Configuration

Once the scopes are configured, run:

```bash
# Get new token with proper scopes
cd services/device-loan
./get-auth0-token.sh "rYpI5akQKsx9W6kbOK6HeLujUKnHV1ZKQO6Q_bg9o0fTCXmRtzAJTy1XUz5g8mzp"

# Update local.settings.json with the new token
# Then test:
npm run test:auth0
```

## How It Works in Production

### When a loan is created:

1. **User creates a loan** → System has user's `userId` from Auth0 JWT token
2. **System fetches user email**:
   ```typescript
   const email = await userService.getUserEmail(userId, accessToken);
   ```
3. **SendGrid sends notification**:
   ```typescript
   await emailService.sendLoanCreatedEmail({
     userEmail: email,
     userName: userName,
     deviceBrand: "Apple",
     deviceModel: "MacBook Pro",
     isWaitlisted: false,
     loanId: loanId
   });
   ```

### Two token types are supported:

1. **User's Access Token** (preferred) - passed from frontend
2. **Management API Token** (fallback) - configured in settings

The service tries the user's token first, then falls back to the management token.

## Files Created for Testing

- `test-sendgrid.ts` - Test SendGrid email sending  ✅ WORKING
- `test-auth0-direct.ts` - Test Auth0 user fetching (needs scope fix)
- `test-auth0-fetch.sh` - Shell script helper
- `list-auth0-users.sh` - List users from Auth0
- `TestAuth0Email.ts` - Azure Function HTTP endpoint for testing

## Quick Commands

```bash
# Test SendGrid (working)
npm run test:sendgrid your-email@example.com

# Test Auth0 (after scope configuration)
npm run test:auth0

# Get new Auth0 token
./get-auth0-token.sh "rYpI5akQKsx9W6kbOK6HeLujUKnHV1ZKQO6Q_bg9o0fTCXmRtzAJTy1XUz5g8mzp"
```

## Next Steps

1. ✅ SendGrid is working - no action needed
2. ⚠️  Configure Auth0 M2M application with `read:users` scope
3. 🔄 Get a fresh token after scope configuration
4. ✅ Run `npm run test:auth0` to verify

