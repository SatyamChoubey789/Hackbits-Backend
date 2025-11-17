const QRCode = require('qrcode');

/**
 * Generate a unique ticket number
 * Format: HACK2025-XXX
 */
const generateTicketNumber = (teamCount) => {
  const year = new Date().getFullYear();
  const paddedNumber = String(teamCount).padStart(3, '0');
  return `HACK${year}-${paddedNumber}`;
};

/**
 * Generate ticket data for QR code (simple barcode alternative)
 */
const generateTicketQRData = async (ticketData) => {
  const data = {
    ticketNumber: ticketData.ticketNumber,
    teamName: ticketData.teamName,
    registrationNumber: ticketData.registrationNumber,
    leaderName: ticketData.leaderName,
    verifiedAt: ticketData.verifiedAt,
    eventName: 'HACKATHON 2025',
  };

  try {
    // Generate small QR code for ticket
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(data), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 200,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating ticket QR:', error);
    return null;
  }
};

/**
 * Generate HTML ticket
 * Creates a beautiful, printable ticket
 */
const generateTicketHTML = (ticketData) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hackathon Ticket - ${ticketData.ticketNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        
        .ticket-container {
          background: white;
          width: 100%;
          max-width: 600px;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        
        .ticket-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          position: relative;
        }
        
        .ticket-header::after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 0;
          right: 0;
          height: 20px;
          background: white;
          border-radius: 50% 50% 0 0 / 100% 100% 0 0;
        }
        
        .event-logo {
          font-size: 48px;
          margin-bottom: 10px;
        }
        
        .event-name {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 5px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        
        .event-tagline {
          font-size: 14px;
          opacity: 0.9;
        }
        
        .ticket-body {
          padding: 40px 30px 30px;
        }
        
        .ticket-number-section {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          border-radius: 15px;
          color: white;
        }
        
        .ticket-number-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 2px;
          opacity: 0.9;
          margin-bottom: 5px;
        }
        
        .ticket-number {
          font-size: 36px;
          font-weight: bold;
          letter-spacing: 3px;
          font-family: 'Courier New', monospace;
        }
        
        .ticket-details {
          margin-bottom: 30px;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 15px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .detail-row:last-child {
          border-bottom: none;
        }
        
        .detail-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .detail-value {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          text-align: right;
        }
        
        .status-badge {
          display: inline-block;
          padding: 6px 16px;
          background: #4caf50;
          color: white;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .qr-section {
          text-align: center;
          padding: 30px;
          background: #f8f9fa;
          border-radius: 15px;
          margin-bottom: 20px;
        }
        
        .qr-code {
          width: 200px;
          height: 200px;
          margin: 0 auto 15px;
          border: 5px solid white;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .qr-instruction {
          font-size: 13px;
          color: #666;
          margin-top: 10px;
        }
        
        .venue-info {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 25px;
          border-radius: 15px;
          margin-bottom: 20px;
        }
        
        .venue-info h3 {
          font-size: 18px;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .venue-detail {
          font-size: 14px;
          margin: 8px 0;
          opacity: 0.95;
        }
        
        .important-note {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        
        .important-note strong {
          color: #856404;
          display: block;
          margin-bottom: 5px;
        }
        
        .important-note p {
          color: #856404;
          font-size: 13px;
          line-height: 1.6;
        }
        
        .ticket-footer {
          text-align: center;
          padding: 20px;
          background: #f8f9fa;
          border-top: 2px dashed #ddd;
        }
        
        .footer-text {
          font-size: 12px;
          color: #666;
          margin: 5px 0;
        }
        
        .print-button {
          display: none;
          margin: 20px auto;
          padding: 12px 30px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 25px;
          font-size: 16px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .print-button:hover {
          background: #5568d3;
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          
          .ticket-container {
            box-shadow: none;
            max-width: 100%;
          }
          
          .print-button {
            display: none !important;
          }
        }
        
        @media screen {
          .print-button {
            display: block;
          }
        }
      </style>
    </head>
    <body>
      <div class="ticket-container">
        <!-- Header -->
        <div class="ticket-header">
          <div class="event-logo">🚀</div>
          <div class="event-name">HACKATHON 2025</div>
          <div class="event-tagline">Innovation • Collaboration • Excellence</div>
        </div>
        
        <!-- Body -->
        <div class="ticket-body">
          <!-- Ticket Number -->
          <div class="ticket-number-section">
            <div class="ticket-number-label">Ticket Number</div>
            <div class="ticket-number">${ticketData.ticketNumber}</div>
          </div>
          
          <!-- Details -->
          <div class="ticket-details">
            <div class="detail-row">
              <span class="detail-label">Team Name</span>
              <span class="detail-value">${ticketData.teamName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Team Leader</span>
              <span class="detail-value">${ticketData.leaderName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Registration No.</span>
              <span class="detail-value">${ticketData.registrationNumber}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Team Size</span>
              <span class="detail-value">${ticketData.teamSize}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status</span>
              <span class="detail-value">
                <span class="status-badge">✓ VERIFIED</span>
              </span>
            </div>
          </div>
          
          <!-- QR Code -->
          <div class="qr-section">
            <img src="${ticketData.qrCode}" alt="Ticket QR Code" class="qr-code" />
            <div class="qr-instruction">
              <strong>Scan at venue for quick check-in</strong><br>
              or show Ticket Number to volunteers
            </div>
          </div>
          
          <!-- Venue Info -->
          <div class="venue-info">
            <h3>📍 Event Details</h3>
            <div class="venue-detail"><strong>Date:</strong> ${ticketData.eventDate || 'January 15-16, 2025'}</div>
            <div class="venue-detail"><strong>Time:</strong> ${ticketData.eventTime || '9:00 AM - 6:00 PM'}</div>
            <div class="venue-detail"><strong>Venue:</strong> ${ticketData.venue || 'College Auditorium'}</div>
            <div class="venue-detail"><strong>Reporting Time:</strong> ${ticketData.reportingTime || '8:30 AM'}</div>
          </div>
          
          <!-- Important Note -->
          <div class="important-note">
            <strong>⚠️ Important Instructions:</strong>
            <p>
              • Bring this ticket (digital or printed) to the venue<br>
              • Bring a valid ID card for verification<br>
              • Reach venue before ${ticketData.reportingTime || '9:00 AM'}<br>
              • This ticket is non-transferable<br>
              • Keep this ticket safe for the entire event
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="ticket-footer">
          <div class="footer-text"><strong>Verified on:</strong> ${new Date(ticketData.verifiedAt).toLocaleString()}</div>
          <div class="footer-text">For support, contact: ${process.env.SUPPORT_EMAIL || 'support@hackathon.com'}</div>
          <div class="footer-text">© ${new Date().getFullYear()} Hackathon. All rights reserved.</div>
        </div>
        
        <button class="print-button" onclick="window.print()">🖨️ Print Ticket</button>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  generateTicketNumber,
  generateTicketQRData,
  generateTicketHTML,
};