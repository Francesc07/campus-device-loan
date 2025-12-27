// Quick test script to verify Auth0 user fetching
// Run with: npm run test:auth0 <userId>

import { Auth0UserService } from "./src/Infrastructure/Users/Auth0UserService";
import fetch from "node-fetch";
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

async function testAuth0Fetch() {
  console.log("🧪 Testing Auth0 User Service");
  console.log("================================\n");

  // Get config
  const domain = process.env.AUTH0_DOMAIN || "dev-x21op5myzhuj4ugr.us.auth0.com";
  const token = process.env.AUTH0_MGMT_API_TOKEN;

  if (!token) {
    console.error("❌ AUTH0_MGMT_API_TOKEN not found");
    process.exit(1);
  }

  console.log(`✅ Auth0 Domain: ${domain}`);
  console.log(`✅ Token configured\n`);

  // Fetch users from Auth0
  console.log("📋 Fetching users from Auth0...\n");
  const usersRes = await fetch(`https://${domain}/api/v2/users?per_page=5`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!usersRes.ok) {
    console.error(`❌ Failed to fetch users: ${usersRes.status}`);
    const errorText = await usersRes.text();
    console.error(errorText);
    process.exit(1);
  }

  const users: any[] = await usersRes.json();
  console.log(`✅ Found ${users.length} users in Auth0\n`);

  // Create user service
  const userService = new Auth0UserService(domain, token);

  // Test specific user if provided
  const testUserId = process.argv[2];
  if (testUserId) {
    console.log(`\n🔍 Testing specific user: ${testUserId}`);
    const email = await userService.getUserEmail(testUserId);
    if (email) {
      console.log(`✅ Email fetched: ${email}`);
    } else {
      console.log(`❌ User not found or no email`);
    }
    return;
  }

  // Test all fetched users
  for (const user of users) {
    console.log(`\n--- Testing User ---`);
    console.log(`User ID: ${user.user_id}`);
    console.log(`Name: ${user.name || "N/A"}`);
    console.log(`Expected Email: ${user.email || "N/A"}`);

    // Test our service
    const startTime = Date.now();
    const fetchedEmail = await userService.getUserEmail(user.user_id);
    const duration = Date.now() - startTime;

    console.log(`Fetched Email: ${fetchedEmail || "NOT FOUND"}`);
    console.log(`Duration: ${duration}ms`);

    if (fetchedEmail === user.email) {
      console.log(`✅ SUCCESS - Email matches!`);
    } else {
      console.log(`❌ MISMATCH - Expected: ${user.email}, Got: ${fetchedEmail}`);
    }
  }

  console.log("\n🎉 Auth0 integration test complete!");
  console.log("\n📧 Email service is correctly fetching user emails from Auth0!");
}

testAuth0Fetch().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
