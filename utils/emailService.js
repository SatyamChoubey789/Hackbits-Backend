const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Email templates
const emailTemplates = {
  // Registration confirmation email
  teamRegistration: (teamData) => ({
    subject: '🎉 Hackathon Registration Successful - Action Required',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
          .info-item { margin: 10px 0; }
          .label { font-weight: bold; color: #667eea; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .steps { background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .step { margin: 10px 0; padding-left: 30px; position: relative; }
          .step:before { content: "✓"; position: absolute; left: 0; color: #667eea; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎊 Registration Successful!</h1>
            <p>Welcome to the Hackathon</p>
          </div>
          <div class="content">
            <p>Dear <strong>${teamData.leaderName}</strong>,</p>
            <p>Congratulations! Your team has been successfully registered for the hackathon.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #667eea;">Team Details</h3>
              <div class="info-item">
                <span class="label">Team Name:</span> ${teamData.teamName}
              </div>
              <div class="info-item">
                <span class="label">Registration Number:</span> ${teamData.registrationNumber}
              </div>
              <div class="info-item">
                <span class="label">Team Size:</span> ${teamData.teamSize}
              </div>
              <div class="info-item">
                <span class="label">Leader:</span> ${teamData.leaderName}
              </div>
              <div class="info-item">
                <span class="label">Email:</span> ${teamData.leaderEmail}
              </div>
            </div>

            <div class="steps">
              <h3 style="margin-top: 0;">📋 Next Steps to Complete Your Registration:</h3>
              <div class="step">Complete payment of ₹${teamData.amount}</div>
              <div class="step">Upload payment screenshot</div>
              <div class="step">Upload your college ID card</div>
              <div class="step">Wait for admin verification</div>
              <div class="step">Receive your ticket via email</div>
            </div>

            <center>
              <a href="${process.env.FRONTEND_URL}/team-details" class="button">
                Complete Payment & Upload Documents
              </a>
            </center>

            <p style="margin-top: 30px; padding: 15px; background: #e3f2fd; border-radius: 5px;">
              <strong>⚠️ Important:</strong> Your registration will only be confirmed after payment verification and document submission. Please complete these steps as soon as possible.
            </p>

            <p>If you have any questions, feel free to contact us.</p>
            <p>Best regards,<br><strong>Hackathon Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} Hackbits Team. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // Payment success and verification email with TICKET
  verificationSuccess: (teamData) => ({
    subject: '✅ Payment Verified - Your Hackathon Ticket 🎫',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-badge { background: #d4edda; color: #155724; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #c3e6cb; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #38ef7d; }
          .info-item { margin: 10px 0; }
          .label { font-weight: bold; color: #11998e; }
          .ticket-container { text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; margin: 30px 0; border-radius: 15px; color: white; }
          .ticket-number { font-size: 32px; font-weight: bold; letter-spacing: 3px; font-family: 'Courier New', monospace; margin: 20px 0; padding: 15px; background: rgba(255,255,255,0.2); border-radius: 10px; }
          .important-box { background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0; }
          .instructions { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .instruction-item { margin: 10px 0; padding-left: 25px; position: relative; }
          .instruction-item:before { content: "→"; position: absolute; left: 0; color: #11998e; font-weight: bold; }
          .button { display: inline-block; padding: 12px 30px; background: white; color: #667eea; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Verification Complete!</h1>
            <p>You're all set for the hackathon</p>
          </div>
          <div class="content">
            <div class="success-badge">
              <h2 style="margin: 0;">✅ Payment Verified Successfully</h2>
              <p style="margin: 10px 0 0 0;">Your registration is now complete!</p>
            </div>

            <p>Dear <strong>${teamData.leaderName}</strong>,</p>
            <p>Great news! Your payment has been verified and your hackathon registration is now <strong>CONFIRMED</strong>.</p>

            <div class="info-box">
              <h3 style="margin-top: 0; color: #11998e;">Registration Details</h3>
              <div class="info-item">
                <span class="label">Team Name:</span> ${teamData.teamName}
              </div>
              <div class="info-item">
                <span class="label">Registration Number:</span> ${teamData.registrationNumber}
              </div>
              <div class="info-item">
                <span class="label">Team Size:</span> ${teamData.teamSize}
              </div>
              <div class="info-item">
                <span class="label">Payment ID:</span> ${teamData.paymentId}
              </div>
              <div class="info-item">
                <span class="label">Amount Paid:</span> ₹${teamData.amount}
              </div>
              <div class="info-item">
                <span class="label">Verified On:</span> ${new Date(teamData.verifiedAt).toLocaleString()}
              </div>
            </div>

            <div class="ticket-container">
              <div style="font-size: 48px; margin-bottom: 10px;">🎫</div>
              <h2 style="margin: 10px 0;">Your Digital Ticket</h2>
              <div class="ticket-number">${teamData.ticketNumber || 'HACK2025-XXX'}</div>
              <p style="font-size: 14px; opacity: 0.9; margin-top: 10px;">Show this ticket number at the venue</p>
              <center>
                <a href="${process.env.FRONTEND_URL}/team-details" class="button">
                  View Full Ticket
                </a>
              </center>
            </div>

            <div class="important-box">
              <h3 style="margin-top: 0; color: #856404;">⚠️ Important Instructions</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Save your ticket</strong> - Click the button above to view and download</li>
                <li><strong>Print it out</strong> - Keep a physical copy as backup</li>
                <li><strong>Bring to venue</strong> - Show ticket number or QR code at entry</li>
                <li><strong>Bring valid ID</strong> - College ID card required for verification</li>
                <li><strong>Non-transferable</strong> - This ticket is unique to your team</li>
              </ul>
            </div>

            <div class="instructions">
              <h3 style="margin-top: 0; color: #0277bd;">📱 How to Use Your Ticket</h3>
              <div class="instruction-item">Login to your dashboard and view your ticket</div>
              <div class="instruction-item">Download or save screenshot of the ticket</div>
              <div class="instruction-item">Keep it on your phone for easy access</div>
              <div class="instruction-item">Present ticket number at the venue entry</div>
              <div class="instruction-item">Our team will check you in instantly</div>
            </div>

            ${teamData.members && teamData.members.length > 0 ? `
              <div class="info-box">
                <h3 style="margin-top: 0; color: #11998e;">Team Members</h3>
                <div class="info-item">
                  <span class="label">Leader:</span> ${teamData.leaderName}
                </div>
                ${teamData.members.map(member => `
                  <div class="info-item">
                    <span class="label">Member:</span> ${member.name} (${member.email})
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #667eea;">
              <h3 style="margin-top: 0; color: #667eea;">📍 Event Information</h3>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${teamData.eventDate || 'To be announced'}</p>
              <!-- <p style="margin: 5px 0;"><strong>Time:</strong> ${teamData.eventTime || 'To be announced'}</p> -->
              <p style="margin: 5px 0;"><strong>Venue:</strong> ${teamData.venue || 'To be announced'}</p>
              <!-- <p style="margin: 5px 0;"><strong>Reporting Time:</strong> ${teamData.reportingTime || 'To be announced'}</p> -->
              <p style="margin-top: 15px; font-size: 12px; color: #666;">*Event timing details will be shared soon</p>
            </div>

            <p style="margin-top: 30px;">We're excited to see you at the hackathon! Get ready to innovate, collaborate, and create something amazing.</p>
            
            <p>Best regards,<br><strong>Hackathon Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>For support, contact us at ${process.env.SUPPORT_EMAIL || 'support@hackathon.com'}</p>
            <p>&copy; ${new Date().getFullYear()} Hackbits Team. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // Payment rejection email
  verificationRejected: (teamData) => ({
    subject: '❌ Registration Verification Issue',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f85032 0%, #e73827 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert-box { background: #f8d7da; color: #721c24; padding: 20px; border-radius: 8px; border: 2px solid #f5c6cb; margin: 20px 0; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .button { display: inline-block; padding: 12px 30px; background: #f85032; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Verification Issue</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${teamData.leaderName}</strong>,</p>
            
            <div class="alert-box">
              <h3 style="margin-top: 0;">Your registration verification could not be completed</h3>
              <p>There was an issue with your payment verification or submitted documents.</p>
            </div>

            <div class="info-box">
              <h3>Team: ${teamData.teamName}</h3>
              <p><strong>Registration Number:</strong> ${teamData.registrationNumber}</p>
              ${teamData.reason ? `<p><strong>Reason:</strong> ${teamData.reason}</p>` : ''}
            </div>

            <h3>What to do next:</h3>
            <ul>
              <li>Review your payment screenshot for clarity</li>
              <li>Ensure your college ID card is clearly visible</li>
              <li>Verify payment ID is correct</li>
              <li>Re-upload the documents if necessary</li>
              <li>Contact support if you need assistance</li>
            </ul>

            <center>
              <a href="${process.env.FRONTEND_URL}/team-details" class="button">
                Re-upload Documents
              </a>
            </center>

            <p style="margin-top: 30px;">If you believe this is an error, please contact our support team immediately.</p>
            
            <p>Best regards,<br><strong>Hackathon Team</strong></p>
          </div>
          <div class="footer">
            <p>For support: ${process.env.SUPPORT_EMAIL || 'support@hackathon.com'}</p>
            <p>&copy; ${new Date().getFullYear()} Hackbits Team. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

// Send email function
const sendEmail = async (to, template, data) => {
  try {
    const emailContent = emailTemplates[template](data);
    
    const mailOptions = {
      from: `"Hackathon Team" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: emailContent.subject,
      html: emailContent.html,
    };

    // Add attachments if present
    if (emailContent.attachments) {
      mailOptions.attachments = emailContent.attachments;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Specific email functions
const sendTeamRegistrationEmail = async (teamData) => {
  return await sendEmail(teamData.leaderEmail, 'teamRegistration', teamData);
};

const sendVerificationSuccessEmail = async (teamData) => {
  return await sendEmail(teamData.leaderEmail, 'verificationSuccess', teamData);
};

const sendVerificationRejectedEmail = async (teamData) => {
  return await sendEmail(teamData.leaderEmail, 'verificationRejected', teamData);
};

module.exports = {
  sendEmail,
  sendTeamRegistrationEmail,
  sendVerificationSuccessEmail,
  sendVerificationRejectedEmail,
};