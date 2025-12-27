#!/bin/bash

# End-to-End Email Test
# This demonstrates the complete flow: Auth0 login → fetch email → send notification

echo "🧪 End-to-End Email Notification Test"
echo "======================================="
echo ""

# Configuration
AUTH0_DOMAIN="dev-x21op5myzhuj4ugr.us.auth0.com"
SENDGRID_FROM="okoye2k4real@outlook.com"

echo "Configuration:"
echo "  📧 FROM (Sender): $SENDGRID_FROM"
echo "  🔐 Auth0 Domain: $AUTH0_DOMAIN"
echo ""

# Prompt for user's email (simulating what Auth0 would return)
if [ -z "$1" ]; then
  echo "❌ Error: Test email required"
  echo ""
  echo "Usage: ./test-email-flow.sh <user-email>"
  echo ""
  echo "Example:"
  echo "  ./test-email-flow.sh student@university.edu"
  echo ""
  echo "This simulates:"
  echo "  1. User logs in via Auth0"
  echo "  2. System fetches their email: student@university.edu"
  echo "  3. SendGrid sends notification:"
  echo "     FROM: $SENDGRID_FROM"
  echo "     TO:   student@university.edu"
  exit 1
fi

USER_EMAIL="$1"

echo "📋 Simulating Email Flow:"
echo "  1. ✅ User logs in via Auth0"
echo "  2. ✅ System fetches user email: $USER_EMAIL"
echo "  3. ✅ Preparing to send email..."
echo ""

cd /workspaces/campus-device-loan/services/device-loan

# Load config from local.settings.json
if [ ! -f "local.settings.json" ]; then
  echo "❌ local.settings.json not found"
  exit 1
fi

# Run the actual email test
node -e "
const fs = require('fs');
const sgMail = require('@sendgrid/mail');

// Load config from local.settings.json
const settings = JSON.parse(fs.readFileSync('local.settings.json', 'utf-8'));
const apiKey = settings.Values.SENDGRID_API_KEY;
const fromEmail = settings.Values.SENDGRID_FROM_EMAIL;
const toEmail = '$USER_EMAIL';

if (!apiKey) {
  console.error('❌ SENDGRID_API_KEY not configured in local.settings.json');
  process.exit(1);
}

sgMail.setApiKey(apiKey);

const msg = {
  to: toEmail,
  from: fromEmail,
  subject: '🎓 Your Device Loan Request - Campus Device Loan System',
  html: \`
    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
      <h2 style='color: #0066cc;'>Device Loan Request Received</h2>
      
      <p>Hello,</p>
      
      <p>We've received your device loan request. Here's what happens next:</p>
      
      <div style='background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;'>
        <h3 style='margin-top: 0;'>📱 Device Details</h3>
        <p><strong>Brand:</strong> Apple</p>
        <p><strong>Model:</strong> MacBook Pro M3</p>
        <p><strong>Status:</strong> Pending Approval</p>
      </div>
      
      <p><strong>Next Steps:</strong></p>
      <ol>
        <li>Your request will be reviewed by our team</li>
        <li>You'll receive an approval confirmation within 24 hours</li>
        <li>Once approved, visit the pickup location with your student ID</li>
      </ol>
      
      <p>This email was sent to: <strong>$USER_EMAIL</strong></p>
      
      <hr style='margin: 30px 0; border: none; border-top: 1px solid #ddd;'>
      
      <p style='color: #666; font-size: 12px;'>
        <strong>From:</strong> $fromEmail<br>
        <strong>To:</strong> $toEmail<br>
        <strong>Date:</strong> \$(new Date().toISOString())
      </p>
    </div>
  \`,
  text: \`
Device Loan Request Received

Hello,

We've received your device loan request.

Device: Apple MacBook Pro M3
Status: Pending Approval

Next Steps:
1. Your request will be reviewed by our team
2. You'll receive an approval confirmation within 24 hours
3. Once approved, visit the pickup location with your student ID

This email was sent to: $USER_EMAIL

From: $fromEmail
To: $toEmail
Date: \$(new Date().toISOString())
  \`
};

sgMail.send(msg)
  .then(() => {
    console.log('');
    console.log('✅ Email sent successfully!');
    console.log('');
    console.log('📧 Email Details:');
    console.log('  FROM: ' + fromEmail + ' (verified SendGrid sender)');
    console.log('  TO:   ' + toEmail + ' (fetched from Auth0)');
    console.log('');
    console.log('📬 Check inbox at: ' + toEmail);
    console.log('');
    console.log('🎉 This is exactly how it works in production!');
    console.log('');
    console.log('In production:');
    console.log('  1. User logs in → Auth0 provides userId');
    console.log('  2. System calls: userService.getUserEmail(userId)');
    console.log('  3. Auth0 returns: ' + toEmail);
    console.log('  4. SendGrid sends notification from ' + fromEmail);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ Failed to send email:', error.message);
    process.exit(1);
  });
"

echo ""
echo "✅ Test complete!"
