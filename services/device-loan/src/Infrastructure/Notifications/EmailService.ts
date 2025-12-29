// src/Infrastructure/Notifications/EmailService.ts

import sgMail from "@sendgrid/mail";

export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * EmailService
 * 
 * Handles sending email notifications via SendGrid
 */
export class EmailService {
  private readonly fromEmail: string;
  private isConfigured: boolean = false;

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@campusdeviceloan.com";

    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.isConfigured = true;
    } else {
      console.warn("⚠️ SendGrid API key not configured. Email notifications will be skipped.");
    }
  }

  /**
   * Send an email notification
   */
  async sendEmail(notification: EmailNotification): Promise<void> {
    if (!this.isConfigured) {
      console.warn("📧 Email skipped (SendGrid not configured):", notification.subject);
      return;
    }

    try {
      const msg = {
        to: notification.to,
        from: this.fromEmail,
        subject: notification.subject,
        text: notification.text || this.stripHtml(notification.html),
        html: notification.html,
      };

      await sgMail.send(msg);
      console.log(`✅ Email sent to ${notification.to}: ${notification.subject}`);
    } catch (error: any) {
      console.error(`❌ Failed to send email to ${notification.to}:`, error.response?.body || error.message);
      // Don't throw - email failures shouldn't break the main flow
    }
  }

  /**
   * Send device waitlist processed notification
   */
  async sendWaitlistProcessedEmail(params: {
    userEmail: string;
    userName: string;
    deviceBrand: string;
    deviceModel: string;
    deviceImageUrl?: string;
    loanId: string;
    reservationId?: string;
  }): Promise<void> {
    const { userEmail, userName, deviceBrand, deviceModel, deviceImageUrl, loanId, reservationId } = params;

    const subject = `✅ Device Available: ${deviceBrand} ${deviceModel}`;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px; }
    .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; border-radius: 5px; }
    .device-info { background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #4CAF50; }
    .device-image { max-width: 100%; height: auto; border-radius: 5px; margin: 15px 0; }
    .cta-button { display: inline-block; background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Your Device is Ready!</h1>
    </div>
    
    <div class="content">
      <p>Hi ${userName},</p>
      
      <p>Great news! The device you requested is now available and has been reserved for you.</p>
      
      <div class="device-info">
        <h3>${deviceBrand} ${deviceModel}</h3>
        ${deviceImageUrl ? `<img src="${deviceImageUrl}" alt="${deviceModel}" class="device-image" />` : ''}
        <p><strong>Status:</strong> <span style="color: #4CAF50;">✅ Reserved and Ready for Pickup</span></p>
        ${reservationId ? `<p><strong>Reservation ID:</strong> ${reservationId}</p>` : ''}
        <p><strong>Loan Request ID:</strong> ${loanId}</p>
      </div>
      
      <p><strong>Next Steps:</strong></p>
      <ol>
        <li>Visit the IT Service Desk to collect your device</li>
        <li>Bring your student ID for verification</li>
        <li>Quote your reservation ID: <strong>${reservationId || loanId}</strong></li>
      </ol>
      
      <p><strong>⏰ Important:</strong> This device is reserved for you for the next <strong>24 hours</strong>. If you don't collect it within this time, it will be automatically released to the next person on the waitlist.</p>
      
      <a href="https://campus-device-loan.azurewebsites.net/my-loans" class="cta-button">View My Loans</a>
    </div>
    
    <div class="footer">
      <p>Campus Device Loan Service</p>
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `;

    await this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  /**
   * Send loan created/waitlisted notification
   */
  async sendLoanCreatedEmail(params: {
    userEmail: string;
    userName: string;
    deviceBrand: string;
    deviceModel: string;
    isWaitlisted: boolean;
    loanId: string;
  }): Promise<void> {
    const { userEmail, userName, deviceBrand, deviceModel, isWaitlisted, loanId } = params;

    if (isWaitlisted) {
      const subject = `📋 Waitlist Confirmed: ${deviceBrand} ${deviceModel}`;
      const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 5px; }
    .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; border-radius: 5px; }
    .device-info { background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #FF9800; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 You're on the Waitlist</h1>
    </div>
    
    <div class="content">
      <p>Hi ${userName},</p>
      
      <p>Thanks for your device loan request. The <strong>${deviceBrand} ${deviceModel}</strong> is currently unavailable, so we've added you to the waitlist.</p>
      
      <div class="device-info">
        <h3>${deviceBrand} ${deviceModel}</h3>
        <p><strong>Request ID:</strong> ${loanId}</p>
        <p><strong>Status:</strong> Waitlisted</p>
      </div>
      
      <p><strong>What happens next?</strong></p>
      <ul>
        <li>We'll notify you via email as soon as a device becomes available</li>
        <li>Devices are allocated on a first-come, first-served basis</li>
        <li>You can check your position anytime in the portal</li>
      </ul>
      
      <p>We'll do our best to get a device to you as soon as possible!</p>
    </div>
    
    <div class="footer">
      <p>Campus Device Loan Service</p>
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
      `;

      await this.sendEmail({
        to: userEmail,
        subject,
        html,
      });
    } else {
      const subject = `✅ Loan Request Confirmed: ${deviceBrand} ${deviceModel}`;
      const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px; }
    .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; border-radius: 5px; }
    .device-info { background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #2196F3; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Loan Request Received</h1>
    </div>
    
    <div class="content">
      <p>Hi ${userName},</p>
      
      <p>Your device loan request has been confirmed!</p>
      
      <div class="device-info">
        <h3>${deviceBrand} ${deviceModel}</h3>
        <p><strong>Request ID:</strong> ${loanId}</p>
        <p><strong>Status:</strong> Pending Approval</p>
      </div>
      
      <p><strong>Next Steps:</strong></p>
      <ul>
        <li>Your request is being processed</li>
        <li>You'll receive a confirmation email once approved</li>
        <li>Then you can collect your device from the IT Service Desk</li>
      </ul>
    </div>
    
    <div class="footer">
      <p>Campus Device Loan Service</p>
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
      `;

      await this.sendEmail({
        to: userEmail,
        subject,
        html,
      });
    }
  }

  /**
   * Send loan activated notification (device collected)
   */
  async sendLoanActivatedEmail(params: {
    userEmail: string;
    userName: string;
    deviceBrand: string;
    deviceModel: string;
    dueDate: string;
    loanId: string;
  }): Promise<void> {
    const { userEmail, userName, deviceBrand, deviceModel, dueDate, loanId } = params;
    const formattedDueDate = new Date(dueDate).toLocaleDateString();

    const subject = `✅ Device Collected: ${deviceBrand} ${deviceModel}`;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px; }
    .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; border-radius: 5px; }
    .device-info { background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #2196F3; }
    .warning-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 Device Loan Active</h1>
    </div>
    
    <div class="content">
      <p>Hi ${userName},</p>
      
      <p>Your device loan is now active! You've successfully collected:</p>
      
      <div class="device-info">
        <h3>${deviceBrand} ${deviceModel}</h3>
        <p><strong>Loan ID:</strong> ${loanId}</p>
        <p><strong>Due Date:</strong> ${formattedDueDate}</p>
      </div>
      
      <div class="warning-box">
        <p><strong>⚠️ Important Reminders:</strong></p>
        <ul>
          <li>Please return the device by <strong>${formattedDueDate}</strong></li>
          <li>Keep the device in good condition</li>
          <li>Report any issues immediately to IT Service Desk</li>
          <li>Late returns may affect your ability to borrow future devices</li>
        </ul>
      </div>
      
      <p>If you need to extend your loan or have any questions, please contact the IT Service Desk.</p>
    </div>
    
    <div class="footer">
      <p>Campus Device Loan Service</p>
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `;

    await this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  /**
   * Send loan cancelled notification
   */
  async sendLoanCancelledEmail(params: {
    userEmail: string;
    userName: string;
    deviceBrand: string;
    deviceModel: string;
    loanId: string;
  }): Promise<void> {
    const { userEmail, userName, deviceBrand, deviceModel, loanId } = params;

    const subject = `❌ Loan Cancelled: ${deviceBrand} ${deviceModel}`;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 5px; }
    .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; border-radius: 5px; }
    .device-info { background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #f44336; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚫 Loan Cancelled</h1>
    </div>
    
    <div class="content">
      <p>Hi ${userName},</p>
      
      <p>Your device loan request has been cancelled:</p>
      
      <div class="device-info">
        <h3>${deviceBrand} ${deviceModel}</h3>
        <p><strong>Loan ID:</strong> ${loanId}</p>
        <p><strong>Status:</strong> Cancelled</p>
      </div>
      
      <p>If you need to request a device again, you can do so through the Campus Device Loan portal.</p>
      
      <p>If you did not request this cancellation, please contact the IT Service Desk immediately.</p>
    </div>
    
    <div class="footer">
      <p>Campus Device Loan Service</p>
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `;

    await this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  /**
   * Send loan returned notification
   */
  async sendLoanReturnedEmail(params: {
    userEmail: string;
    userName: string;
    deviceBrand: string;
    deviceModel: string;
    loanId: string;
    wasLate: boolean;
  }): Promise<void> {
    const { userEmail, userName, deviceBrand, deviceModel, loanId, wasLate } = params;

    const subject = `✅ Device Returned: ${deviceBrand} ${deviceModel}`;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px; }
    .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; border-radius: 5px; }
    .device-info { background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #4CAF50; }
    .warning-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Device Successfully Returned</h1>
    </div>
    
    <div class="content">
      <p>Hi ${userName},</p>
      
      <p>Thank you for returning your device:</p>
      
      <div class="device-info">
        <h3>${deviceBrand} ${deviceModel}</h3>
        <p><strong>Loan ID:</strong> ${loanId}</p>
        <p><strong>Status:</strong> Returned</p>
      </div>
      
      ${wasLate ? `
      <div class="warning-box">
        <p><strong>⚠️ Late Return Notice:</strong></p>
        <p>This device was returned after its due date. Please ensure future loans are returned on time to maintain your borrowing privileges.</p>
      </div>
      ` : `
      <p>🌟 Thank you for returning the device on time!</p>
      `}
      
      <p>You can borrow another device anytime through the Campus Device Loan portal.</p>
    </div>
    
    <div class="footer">
      <p>Campus Device Loan Service</p>
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `;

    await this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  /**
   * Strip HTML tags for plain text version
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  }
}
