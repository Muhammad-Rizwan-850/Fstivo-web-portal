#!/usr/bin/env node
/**
 * Test Resend Email Configuration
 */

async function testResendEmail() {
  const API_KEY = 're_gtfts5dY_EmMxvNEiN2WUdUBqdcwrGiTP';

  console.log('📧 Testing Resend Email Configuration\n');
  console.log('API Key:', API_KEY.substring(0, 10) + '...\n');

  const testEmail = {
    from: 'FSTIVO <onboarding@resend.dev>',  // Using Resend's onboarding domain for testing
    to: 'rizwanrafique850@gmail.com', // Your registered Resend email
    subject: 'FSTIVO - Email Configuration Test',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Email Configuration Successful!</h1>
            </div>
            <div class="content">
              <h2>Welcome to FSTIVO</h2>
              <p>Your email service is now configured and working correctly.</p>
              <p><strong>Configuration Details:</strong></p>
              <ul>
                <li>Service: Resend</li>
                <li>From: noreply@fstivo.com</li>
                <li>Status: Active</li>
              </ul>
              <p>You can now send emails for:</p>
              <ul>
                <li>User registration confirmations</li>
                <li>Password reset links</li>
                <li>Event notifications</li>
                <li>Marketing campaigns</li>
              </ul>
              <a href="https://fstivo.com" class="button">Visit FSTIVO</a>
            </div>
            <div class="footer">
              <p>&copy; 2025 FSTIVO. All rights reserved.</p>
              <p>This is a test email. You can safely ignore it.</p>
            </div>
          </div>
        </body>
      </html>
    `
  };

  console.log('Sending test email...');
  console.log('From:', testEmail.from);
  console.log('To:', testEmail.to);
  console.log('Subject:', testEmail.subject);
  console.log('');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testEmail)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Email sent successfully!');
      console.log('Message ID:', data.id);
      console.log('');
      console.log('📊 View email stats:');
      console.log('https://resend.com/dashboard/emails');
    } else {
      console.log('❌ Failed to send email');
      console.log('Error:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('Next Steps:');
  console.log('');
  console.log('1. Verify domain in Resend Dashboard:');
  console.log('   https://resend.com/domains');
  console.log('');
  console.log('2. Add DNS records for your domain:');
  console.log('   - TXT: resend._domainkey.your-domain.com');
  console.log('   - TXT: _dmarc.your-domain.com');
  console.log('   - TXT: @ (v=spf1 include:resend.com ~all)');
  console.log('');
  console.log('3. Test with your email address:');
  console.log('   Update "to" field in this script with your email');
  console.log('═══════════════════════════════════════════════════════════════');
}

// Run the test
testResendEmail();
