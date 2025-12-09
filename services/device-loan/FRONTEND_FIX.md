# Frontend Authentication Fix

## ✅ Backend Configuration Complete

The following Auth0 settings have been configured:

### Local Development
`/services/device-loan/local.settings.json`:
```json
{
  "AUTH0_DOMAIN": "dev-x21op5myzhuj4ugr.us.auth0.com",
  "AUTH0_AUDIENCE": "https://campus-deviceloan-api"
}
```

### Azure Function App (Production)
✅ Configured in `deviceloan-dev-ab07-func`:
- `AUTH0_DOMAIN`: `dev-x21op5myzhuj4ugr.us.auth0.com`
- `AUTH0_AUDIENCE`: `https://campus-deviceloan-api`

## ⚠️ Frontend Issue: ID Token vs Access Token

### Current Problem
Your frontend logs show:
```
Token scopes: openid profile email
```

This indicates the frontend is receiving an **ID Token** instead of an **Access Token**. ID tokens:
- ✅ Prove user identity
- ❌ Don't contain API permissions (like `view:my-loans`, `read:devices`)
- ❌ Backend rejects them with 401 Unauthorized

### Required Fix in Frontend

You need to request an **Access Token** by specifying the `audience` parameter when calling `getAccessTokenSilently()`.

#### Find This Code in Your Frontend:

Look for where you're getting the token (probably in `axiosClientAuth0.ts` or similar):

```typescript
// ❌ WRONG - Gets ID token
const token = await getAccessTokenSilently();
```

#### Change It To:

```typescript
// ✅ CORRECT - Gets Access token with permissions
const token = await getAccessTokenSilently({
  authorizationParams: {
    audience: "https://campus-deviceloan-api",  // Must match backend AUTH0_AUDIENCE
    scope: "openid profile email view:my-loans create:loan cancel:loan read:devices"
  }
});
```

### Where to Make Changes

#### 1. Token Request in API Client

**File**: `axiosClientAuth0.ts` (or wherever you attach tokens to requests)

```typescript
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';

const { getAccessTokenSilently } = useAuth0();

// Add request interceptor
axiosInstance.interceptors.request.use(async (config) => {
  try {
    // Request access token with API audience
    const token = await getAccessTokenSilently({
      authorizationParams: {
        audience: "https://campus-deviceloan-api",
        scope: "openid profile email view:my-loans create:loan cancel:loan read:devices"
      }
    });
    
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  } catch (error) {
    console.error('Failed to get access token:', error);
    throw error;
  }
});
```

#### 2. Auth0Provider Configuration

**File**: Where you initialize Auth0 (probably in `main.tsx` or `App.tsx`)

```typescript
import { Auth0Provider } from '@auth0/auth0-react';

<Auth0Provider
  domain={import.meta.env.VITE_AUTH0_DOMAIN}
  clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
  authorizationParams={{
    redirect_uri: window.location.origin,
    audience: import.meta.env.VITE_AUTH0_AUDIENCE,  // CRITICAL: Add this!
    scope: "openid profile email view:my-loans create:loan cancel:loan read:devices"
  }}
>
  <App />
</Auth0Provider>
```

### Environment Variables Check

Verify your `.env` file has:
```env
VITE_AUTH0_DOMAIN=dev-x21op5myzhuj4ugr.us.auth0.com
VITE_AUTH0_CLIENT_ID=DDv0CHqB22w1pRkqz4w9tChEx3ylGGwU
VITE_AUTH0_AUDIENCE=https://campus-deviceloan-api
```

## 🔍 How to Verify the Fix

### 1. Check Token in Browser Console

After making the changes, check your browser console. You should see:

```
Token retrieved successfully: Yes
Token scopes: openid profile email view:my-loans create:loan cancel:loan read:devices
```

### 2. Decode the Token

Copy the token from the network request and paste it into https://jwt.io

Verify:
- ✅ `aud` (audience): `https://campus-deviceloan-api`
- ✅ `permissions` array contains: `["view:my-loans", "create:loan", "cancel:loan", "read:devices"]`
- ✅ `iss` (issuer): `https://dev-x21op5myzhuj4ugr.us.auth0.com/`

### 3. Test API Calls

Try calling the API:
```bash
# Should return 200 instead of 401
GET https://deviceloan-dev-ab07-func.azurewebsites.net/api/loan/list?userId=auth0|69354f8bdcf452e5f17fdb41
Authorization: Bearer <your-access-token>
```

## 🔐 Auth0 Permissions Setup

Your users need to have the required permissions assigned in Auth0.

### Check User Permissions in Auth0 Dashboard

1. Go to https://manage.auth0.com
2. Navigate to **User Management > Users**
3. Select your test user
4. Go to **Permissions** tab
5. Ensure these permissions are assigned:
   - `view:my-loans`
   - `create:loan`
   - `cancel:loan`
   - `read:devices`

### OR: Assign Permissions via Roles

1. Create roles in Auth0:
   - **Student**: `view:my-loans`, `create:loan`, `cancel:loan`, `read:devices`
   - **Staff**: `manage:all-loans`, `write:devices`, `read:devices`
2. Assign roles to users
3. Permissions are automatically included in access tokens

## 📋 Backend Endpoints & Required Permissions

| Endpoint | Method | Permission Required |
|----------|--------|-------------------|
| `/api/loan/list` | GET | `view:my-loans` |
| `/api/loan/create` | POST | `create:loan` |
| `/api/loan/id/{id}` | GET | `view:my-loans` |
| `/api/loan/cancel` | POST | `cancel:loan` |
| `/api/devices/list` | GET | `read:devices` |
| `/api/devices/id/{id}` | GET | `read:devices` |

## 🚀 Quick Test

After implementing the fixes:

1. **Clear browser cache and local storage**
2. **Log out and log back in** (to get a fresh token)
3. **Check browser console** for token scopes
4. **Try accessing dashboard** - should work without 401 errors

## Need Help?

See the detailed guide: [AUTH0_SETUP.md](./AUTH0_SETUP.md)
