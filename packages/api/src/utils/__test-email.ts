/**
 * Email Service Test Script
 *
 * Run with: bun packages/api/src/utils/__test-email.ts
 */

import { emailService } from "./email";

async function testEmailService() {
  console.log("\n🧪 Testing Email Service\n");
  console.log("================================");

  try {
    // Test Portal Invite
    console.log("\n1. Testing Portal Invite Email...");
    await emailService.sendPortalInvite({
      clientName: "John Doe",
      email: "john.doe@example.com",
      inviteUrl: "http://localhost:5173/portal/register?token=test123",
      expiresInDays: 7,
      invitedBy: "Grace Cameron",
    });
    console.log("✅ Portal invite email sent successfully");

    // Test Password Reset
    console.log("\n2. Testing Password Reset Email...");
    await emailService.sendPasswordReset({
      email: "john.doe@example.com",
      resetUrl: "http://localhost:5173/portal/reset-password?token=test456",
      expiresInHours: 1,
    });
    console.log("✅ Password reset email sent successfully");

    // Test Welcome Email
    console.log("\n3. Testing Welcome Email...");
    await emailService.sendWelcomeEmail({
      clientName: "John Doe",
      email: "john.doe@example.com",
      loginUrl: "http://localhost:5173/portal/login",
    });
    console.log("✅ Welcome email sent successfully");

    // Test Staff Password Setup
    console.log("\n4. Testing Staff Password Setup Email...");
    await emailService.sendStaffPasswordSetup({
      staffName: "Jane Smith",
      email: "jane.smith@example.com",
      setupUrl: "http://localhost:5173/staff/setup-password?token=test789",
      expiresInHours: 24,
      invitedBy: "Admin User",
    });
    console.log("✅ Staff password setup email sent successfully");

    console.log("\n================================");
    console.log("✅ All email tests passed!");
    console.log("\nNote: If RESEND_API_KEY is not configured,");
    console.log("emails are logged to console (see above).\n");
  } catch (error) {
    console.error("\n❌ Error testing email service:", error);
    process.exit(1);
  }
}

testEmailService();
