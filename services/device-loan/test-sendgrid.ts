// Test SendGrid email sending
// Run with: npm run test:sendgrid

import { EmailService } from "./src/Infrastructure/Notifications/EmailService";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from local.settings.json
try {
  const settingsPath = path.join(__dirname, "local.settings.json");
  if (fs.existsSync(settingsPath)) {
    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    Object.assign(process.env, settings.Values);
  }
} catch (error) {
  console.warn("⚠️  Could not load local.settings.json");
}

async function testSendGrid() {
  console.log("📧 Testing SendGrid Email Service");
  console.log("===================================\n");

  const emailService = new EmailService();

  // Check if configured
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;

  console.log(`SendGrid API Key: ${apiKey ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`From Email: ${fromEmail || 'Not set'}\n`);

  if (!apiKey) {
    console.error("❌ SENDGRID_API_KEY not configured");
    console.log("\nTo configure:");
    console.log("1. Get API key from SendGrid dashboard");
    console.log("2. Add to local.settings.json:");
    console.log('   "SENDGRID_API_KEY": "SG.xxx..."');
    process.exit(1);
  }

  // Get test email from command line or use default
  const testEmail = process.argv[2] || fromEmail || "test@example.com";

  console.log(`🧪 Sending test email to: ${testEmail}\n`);

  try {
    await emailService.sendEmail({
      to: testEmail,
      subject: "🧪 Test Email - Device Loan System",
      html: `
        <h2>Test Email Successful!</h2>
        <p>This is a test email from the Device Loan System.</p>
        <p>If you received this, SendGrid is configured correctly!</p>
        <hr>
        <p><small>Sent at: ${new Date().toISOString()}</small></p>
      `,
      text: `Test Email Successful!\n\nThis is a test email from the Device Loan System.\nIf you received this, SendGrid is configured correctly!\n\nSent at: ${new Date().toISOString()}`
    });

    console.log("✅ Email sent successfully!");
    console.log(`\n📬 Check your inbox at: ${testEmail}`);
    console.log("\n🎉 SendGrid integration is working correctly!");

  } catch (error: any) {
    console.error("❌ Failed to send email:", error.message);
    console.error("\n⚠️  Possible issues:");
    console.error("   - Invalid SendGrid API key");
    console.error("   - Sender email not verified in SendGrid");
    console.error("   - Network connectivity issues");
    process.exit(1);
  }
}

testSendGrid();
