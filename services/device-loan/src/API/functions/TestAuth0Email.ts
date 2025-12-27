// src/API/functions/TestAuth0Email.ts

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Auth0UserService } from "../../Infrastructure/Users/Auth0UserService";
import { EmailService } from "../../Infrastructure/Notifications/EmailService";

/**
 * Test function to verify Auth0 user fetching and email sending
 * 
 * Usage:
 * GET /api/test-auth0-email?userId=auth0|xxxxx
 * 
 * Or with Authorization header to use frontend token:
 * GET /api/test-auth0-email?userId=auth0|xxxxx
 * Authorization: Bearer <user-token>
 */
export async function testAuth0Email(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const userId = request.query.get("userId");
    
    if (!userId) {
      return {
        status: 400,
        jsonBody: {
          error: "Missing userId query parameter",
          usage: "GET /api/test-auth0-email?userId=auth0|xxxxx"
        }
      };
    }

    // Get Auth0 configuration
    const auth0Domain = process.env.AUTH0_DOMAIN;
    const auth0MgmtToken = process.env.AUTH0_MGMT_API_TOKEN;

    if (!auth0Domain || !auth0MgmtToken) {
      return {
        status: 500,
        jsonBody: {
          error: "Auth0 not configured",
          details: {
            hasDomain: !!auth0Domain,
            hasToken: !!auth0MgmtToken
          }
        }
      };
    }

    // Extract access token from Authorization header if provided
    const authHeader = request.headers.get("authorization");
    const userAccessToken = authHeader?.startsWith("Bearer ") 
      ? authHeader.substring(7) 
      : undefined;

    context.log(`🧪 Testing Auth0 user fetch for userId: ${userId}`);
    context.log(`Using ${userAccessToken ? 'user' : 'management'} token`);

    // Initialize services
    const userService = new Auth0UserService(auth0Domain, auth0MgmtToken);
    const emailService = new EmailService();

    // Fetch user email from Auth0
    const startTime = Date.now();
    const userEmail = await userService.getUserEmail(userId, userAccessToken);
    const fetchDuration = Date.now() - startTime;

    if (!userEmail) {
      return {
        status: 404,
        jsonBody: {
          error: "User not found or email not available",
          userId,
          fetchDuration: `${fetchDuration}ms`,
          auth0Domain,
          tokenType: userAccessToken ? 'user' : 'management'
        }
      };
    }

    context.log(`✅ Successfully fetched email: ${userEmail}`);

    // Check if SendGrid is configured
    const sendgridConfigured = !!process.env.SENDGRID_API_KEY;
    
    let emailSent = false;
    if (sendgridConfigured) {
      // Send a test email
      await emailService.sendEmail({
        to: userEmail,
        subject: "🧪 Auth0 Integration Test - Device Loan System",
        html: `
          <h2>Auth0 Integration Test Successful!</h2>
          <p>This is a test email to verify that the Device Loan System can successfully:</p>
          <ul>
            <li>✅ Fetch your email from Auth0</li>
            <li>✅ Send emails via SendGrid</li>
          </ul>
          <p><strong>User ID:</strong> ${userId}</p>
          <p><strong>Email:</strong> ${userEmail}</p>
          <p><strong>Fetch Duration:</strong> ${fetchDuration}ms</p>
          <p><strong>Token Type:</strong> ${userAccessToken ? 'User Access Token' : 'Management API Token'}</p>
          <hr>
          <p><small>If you received this email, your integration is working correctly! 🎉</small></p>
        `,
        text: `Auth0 Integration Test Successful!\n\nUser ID: ${userId}\nEmail: ${userEmail}\nFetch Duration: ${fetchDuration}ms\n\nIf you received this email, your integration is working correctly!`
      });
      emailSent = true;
    }

    return {
      status: 200,
      jsonBody: {
        success: true,
        userId,
        email: userEmail,
        fetchDuration: `${fetchDuration}ms`,
        emailSent,
        sendgridConfigured,
        tokenType: userAccessToken ? 'user' : 'management',
        message: emailSent 
          ? `Successfully fetched email and sent test email to ${userEmail}` 
          : `Successfully fetched email: ${userEmail}. SendGrid not configured, email not sent.`
      }
    };

  } catch (error: any) {
    context.error("❌ Test failed:", error);
    return {
      status: 500,
      jsonBody: {
        error: "Test failed",
        message: error.message,
        stack: error.stack
      }
    };
  }
}

app.http("testAuth0Email", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "test-auth0-email",
  handler: testAuth0Email,
});
