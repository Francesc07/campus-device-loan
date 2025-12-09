# Auth0 Setup Guide for Device Loan Service

## Problem Overview

The frontend is receiving 401 Unauthorized errors because:

1. **Missing Environment Variables**: `AUTH0_DOMAIN` and `AUTH0_AUDIENCE` are not configured in Azure or local settings
2. **Token Type Mismatch**: Frontend is getting an ID token (with `openid profile email` scopes) instead of an API access token (with permission scopes like `view:my-loans`, `read:devices`)

## Required Auth0 Configuration

### 1. Auth0 Application Setup

In your Auth0 Dashboard (https://manage.auth0.com/):

#### A. Create an API
1. Navigate to **Applications > APIs**
2. Click **Create API**
3. Set the following:
   - **Name**: Device Loan API
   - **Identifier**: `https://deviceloan.yourcompany.com/api` (or your preferred identifier)
   - **Signing Algorithm**: RS256
4. Click **Create**

#### B. Define Permissions (Scopes)
In your API settings, go to the **Permissions** tab and add:

```
view:my-loans          - View your own loans
create:loan            - Create a new loan
cancel:loan            - Cancel your own loan
read:devices           - View device catalog
write:devices          - Update device information
manage:all-loans       - Admin: manage all loans (staff only)
```

#### C. Configure Your Application
1. Navigate to **Applications > Applications**
2. Select your SPA (Single Page Application)
3. In **Settings**:
   - Add your allowed callback URLs
   - Add your allowed logout URLs
   - Add your allowed web origins
4. In the **APIs** tab:
   - Authorize your API for this application

### 2. Backend Configuration

#### Local Development

Update `/services/device-loan/local.settings.json`:

```json
{
  "Values": {
    "AUTH0_DOMAIN": "your-tenant.auth0.com",
    "AUTH0_AUDIENCE": "https://deviceloan.yourcompany.com/api"
  }
}
```

#### Azure Function App Configuration

Add the environment variables to your Azure Function App:

```bash
# Set Auth0 Domain
az functionapp config appsettings set \
  --name deviceloan-dev-ab07-func \
  --resource-group deviceloan-dev-ab07-rg \
  --settings AUTH0_DOMAIN="your-tenant.auth0.com"

# Set Auth0 Audience (API Identifier)
az functionapp config appsettings set \
  --name deviceloan-dev-ab07-func \
  --resource-group deviceloan-dev-ab07-rg \
  --settings AUTH0_AUDIENCE="https://deviceloan.yourcompany.com/api"
```

Or via Azure Portal:
1. Navigate to your Function App
2. Go to **Configuration > Application settings**
3. Add new settings:
   - `AUTH0_DOMAIN`: `your-tenant.auth0.com`
   - `AUTH0_AUDIENCE`: `https://deviceloan.yourcompany.com/api`
4. Click **Save** and **Continue**

### 3. Frontend Configuration

The frontend needs to request tokens with the correct audience. Update your Auth0 configuration:

**In your frontend Auth0 setup (where you initialize Auth0Provider):**

```typescript
import { Auth0Provider } from '@auth0/auth0-react';

<Auth0Provider
  domain="your-tenant.auth0.com"
  clientId="YOUR_CLIENT_ID"
  authorizationParams={{
    redirect_uri: window.location.origin,
    audience: "https://deviceloan.yourcompany.com/api",  // CRITICAL: Must match backend
    scope: "openid profile email view:my-loans create:loan cancel:loan read:devices"
  }}
>
  <App />
</Auth0Provider>
```

**When making API calls, request the access token with audience:**

```typescript
import { useAuth0 } from '@auth0/auth0-react';

const { getAccessTokenSilently } = useAuth0();

// Get access token with API audience
const token = await getAccessTokenSilently({
  authorizationParams: {
    audience: "https://deviceloan.yourcompany.com/api",
    scope: "view:my-loans read:devices"
  }
});

// Use token in API requests
axios.get('/api/loan/list', {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

### 4. Assign Permissions to Users

#### Via Auth0 Dashboard:
1. Navigate to **User Management > Users**
2. Select a user
3. Go to **Permissions** tab
4. Assign the required permissions for their role

#### Via Auth0 Rules (Automatic):
Create a rule to automatically assign permissions based on user metadata:

```javascript
function assignPermissions(user, context, callback) {
  const namespace = 'https://deviceloan.yourcompany.com';
  
  // Example: Assign permissions based on user role
  const roles = user.app_metadata?.roles || [];
  const permissions = [];
  
  if (roles.includes('student')) {
    permissions.push('view:my-loans', 'create:loan', 'cancel:loan', 'read:devices');
  }
  
  if (roles.includes('staff')) {
    permissions.push('manage:all-loans', 'write:devices', 'read:devices');
  }
  
  context.accessToken[`${namespace}/permissions`] = permissions;
  context.accessToken[`${namespace}/roles`] = roles;
  
  callback(null, user, context);
}
```

## Testing the Configuration

### 1. Test Token Generation

Use Auth0's test tab or this script:

```bash
# Request a token
curl --request POST \
  --url https://your-tenant.auth0.com/oauth/token \
  --header 'content-type: application/json' \
  --data '{
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "audience": "https://deviceloan.yourcompany.com/api",
    "grant_type": "client_credentials"
  }'
```

### 2. Decode the Token

Copy the token and decode it at https://jwt.io. Verify:

- `aud` (audience) matches your API identifier
- `iss` (issuer) is `https://your-tenant.auth0.com/`
- `permissions` array contains the expected scopes

### 3. Test Backend Endpoint

```bash
# Test with the token
curl -X GET "https://deviceloan-dev-ab07-func.azurewebsites.net/api/loan/list?userId=test123" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Common Issues

### Issue: "Token scopes: openid profile email" (No Permissions)

**Cause**: Frontend is requesting an ID token instead of an access token.

**Fix**: Add `audience` parameter when calling `getAccessTokenSilently()`:

```typescript
const token = await getAccessTokenSilently({
  authorizationParams: {
    audience: "https://deviceloan.yourcompany.com/api"
  }
});
```

### Issue: 401 Unauthorized

**Causes**:
1. `AUTH0_DOMAIN` or `AUTH0_AUDIENCE` not configured in backend
2. Token expired
3. Token not sent with request
4. Audience mismatch

**Fix**: Verify environment variables and token structure.

### Issue: 403 Forbidden (Insufficient Permissions)

**Cause**: User doesn't have required permissions.

**Fix**: Assign permissions in Auth0 dashboard or via rules.

## Backend Endpoints and Required Permissions

| Endpoint | Method | Required Permission |
|----------|--------|-------------------|
| `/api/loan/list` | GET | `view:my-loans` |
| `/api/loan/create` | POST | `create:loan` |
| `/api/loan/id/{id}` | GET | `view:my-loans` |
| `/api/loan/cancel` | POST | `cancel:loan` |
| `/api/devices/list` | GET | `read:devices` |
| `/api/devices/id/{id}` | GET | `read:devices` |
| `/api/devices/sync` | POST | `write:devices` |

## Next Steps

1. ✅ Configure Auth0 API and permissions
2. ✅ Add `AUTH0_DOMAIN` and `AUTH0_AUDIENCE` to backend settings
3. ✅ Update frontend to request access tokens with audience
4. ✅ Assign permissions to test users
5. ✅ Test the authentication flow end-to-end

## Additional Resources

- [Auth0 API Authorization](https://auth0.com/docs/secure/tokens/access-tokens/get-access-tokens)
- [Auth0 React SDK](https://auth0.com/docs/quickstart/spa/react)
- [JWT Token Structure](https://jwt.io/introduction)
