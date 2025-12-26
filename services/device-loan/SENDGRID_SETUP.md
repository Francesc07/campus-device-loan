# SendGrid Email Notification Setup

This guide explains how to configure SendGrid email notifications for the Device Loan service.

## Prerequisites

- Node.js 0.10, 0.12, or 4+ (we're using Node.js 22)
- SendGrid account with API key
- SendGrid sender email verified

## Local Development Setup

### 1. Environment Variables

The SendGrid configuration is already added to `local.settings.json`:

```json
{
  "Values": {
    "SENDGRID_API_KEY": "<your-sendgrid-api-key-here>",
    "SENDGRID_FROM_EMAIL": "noreply@campusdeviceloan.com"
  }
}
```

### 2. Package Installation

The `@sendgrid/mail` package is already installed via npm:

```bash
npm install @sendgrid/mail
```

## Azure Function App Configuration

### Configure Application Settings

Add the SendGrid settings to each Azure Function App environment (DEV, TEST, PROD):

#### Using Azure Portal:

1. Go to **Azure Portal** → **Function App** (e.g., `deviceloan-test-ab07-func`)
2. Navigate to **Settings** → **Configuration**
3. Click **+ New application setting** and add:

   ```
   Name: SENDGRID_API_KEY
   Value: <your-sendgrid-api-key-here>
   ```

4. Add another setting:

   ```
   Name: SENDGRID_FROM_EMAIL
   Value: noreply@campusdeviceloan.com
   ```

5. Click **Save** and **Continue** to restart the Function App

#### Using Azure CLI:

```bash
# Set for DEV environment
az functionapp config appsettings set \
  --name deviceloan-dev-ab07-func \
  --resource-group CampusDeviceLender-dev-Ab07-rg \
  --settings \
    SENDGRID_API_KEY="<your-sendgrid-api-key-here>" \
    SENDGRID_FROM_EMAIL="noreply@campusdeviceloan.com"

# Set for TEST environment
az functionapp config appsettings set \
  --name deviceloan-test-ab07-func \
  --resource-group CampusDeviceLender-test-Ab07-rg \
  --settings \
    SENDGRID_API_KEY="<your-sendgrid-api-key-here>" \
    SENDGRID_FROM_EMAIL="noreply@campusdeviceloan.com"

# Set for PROD environment
az functionapp config appsettings set \
  --name deviceloan-prod-ab07-func \
  --resource-group CampusDeviceLender-prod-Ab07-rg \
  --settings \
    SENDGRID_API_KEY="<your-sendgrid-api-key-here>" \
    SENDGRID_FROM_EMAIL="noreply@campusdeviceloan.com"
```

## Email Notifications Implemented

### 1. Waitlist Processed Notification

**Trigger:** When a device becomes available and a waitlisted student is automatically moved to Pending status

**Template:** Professional email with:
- Device information (brand, model, image)
- Loan request ID
- Next steps for confirmation and pickup
- 24-hour confirmation deadline

**Code Location:** `ProcessWaitlistUseCase.ts`

### 2. Loan Created Notification

**Trigger:** When a student creates a new loan request

**Two variants:**
- **Available Device:** Confirmation email with pending approval status
- **Unavailable Device:** Waitlist confirmation with expectations

**Code Location:** `CreateLoanUseCase.ts`

## Email Service Architecture

### EmailService (`src/Infrastructure/Notifications/EmailService.ts`)

Provides reusable methods for sending emails:

```typescript
// Send waitlist processed email
await emailService.sendWaitlistProcessedEmail({
  userEmail: "student@university.edu",
  userName: "John Doe",
  deviceBrand: "Apple",
  deviceModel: "MacBook Pro M3",
  deviceImageUrl: "https://...",
  loanId: "abc-123"
});

// Send loan created email
await emailService.sendLoanCreatedEmail({
  userEmail: "student@university.edu",
  userName: "John Doe",
  deviceBrand: "Apple",
  deviceModel: "MacBook Pro M3",
  isWaitlisted: false,
  loanId: "abc-123"
});
```

### Error Handling

- If SendGrid API key is not configured, emails are skipped (won't break main flow)
- Failed email sends are logged but don't throw errors
- Service degrades gracefully when email is unavailable

## Testing Email Notifications

### 1. Test Locally

```bash
# Run the function app locally
npm run start

# Create a loan for an unavailable device (triggers waitlist email)
curl -X POST http://localhost:7071/api/loan \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "auth0|123",
    "deviceId": "device-1"
  }'

# Simulate device becoming available (triggers waitlist processed email)
# This would happen via catalog update or device return
```

### 2. Verify SendGrid Dashboard

1. Go to **SendGrid Dashboard** → **Activity**
2. Check for sent emails
3. Review delivery status and any bounces

### 3. Check Application Insights

Logs will show email activity:

```
✅ Email sent to student@university.edu: Device Available: Apple MacBook Pro M3
📧 Email skipped (SendGrid not configured): Waitlist Confirmed: Apple MacBook Pro M3
❌ Failed to send email to student@university.edu: [error details]
```

## Email Templates

All email templates use responsive HTML with:
- Professional styling
- Clear call-to-action buttons
- Device images (when available)
- Consistent branding
- Mobile-friendly design

### Customization

To customize email templates, edit methods in `EmailService.ts`:
- `sendWaitlistProcessedEmail()` - Device available notification
- `sendLoanCreatedEmail()` - Loan request confirmation/waitlist

## Best Practices

1. **Sender Email Verification:** Ensure `noreply@campusdeviceloan.com` is verified in SendGrid
2. **API Key Security:** Never commit API keys to git (use environment variables)
3. **Rate Limits:** SendGrid free tier has sending limits - monitor usage
4. **Email Content:** Keep emails concise and actionable
5. **Unsubscribe Links:** Consider adding for production (SendGrid requirement)

## Troubleshooting

### Emails Not Sending

1. Check Application Insights for email errors
2. Verify `SENDGRID_API_KEY` is set in Azure Function App settings
3. Confirm sender email is verified in SendGrid
4. Check SendGrid dashboard for blocked/bounced emails

### Wrong Sender Email

Update `SENDGRID_FROM_EMAIL` in:
- `local.settings.json` (local)
- Azure Function App Configuration (cloud)

### Template Issues

Edit templates in `EmailService.ts` and redeploy:

```bash
npm run build
func azure functionapp publish deviceloan-test-ab07-func
```

## EU Data Residency (if needed)

For EU Data Residency (via EU-pinned subuser), add in `EmailService.ts`:

```typescript
sgMail.setApiKey(apiKey);
sgMail.setDataResidency("eu");  // Add this line
```

## Related Files

- Email Service: `src/Infrastructure/Notifications/EmailService.ts`
- Waitlist Use Case: `src/Application/UseCases/ProcessWaitlistUseCase.ts`
- Create Loan Use Case: `src/Application/UseCases/CreateLoanUseCase.ts`
- Service Configuration: `src/appServices.ts`
- Local Settings: `local.settings.json`

## Security Note

⚠️ **Important:** The API key shown in this documentation is for initial setup. In production:

1. **Rotate the API key** regularly
2. **Use Azure Key Vault** for sensitive configuration
3. **Restrict API key permissions** to only what's needed (Mail Send)
4. **Monitor API key usage** in SendGrid dashboard

## Next Steps

1. ✅ Install `@sendgrid/mail` package
2. ✅ Create `EmailService.ts`
3. ✅ Integrate with use cases
4. ✅ Add configuration to `local.settings.json`
5. ⏳ **Configure Azure Function App settings** (do this next!)
6. ⏳ **Verify sender email** in SendGrid
7. ⏳ **Test email flow** end-to-end
8. ⏳ **Monitor SendGrid dashboard** for delivery status

---

For more information, see [SendGrid Documentation](https://docs.sendgrid.com/for-developers/sending-email/quickstart-nodejs)
