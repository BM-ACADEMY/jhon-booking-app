export const getGuestBookingEmailTemplate = (user, booking, primaryRoomDetails) => {
  const nights = Math.max(1, Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24)));
  const invoiceDate = new Date(booking.createdAt || Date.now()).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const checkInDate = new Date(booking.checkIn).toLocaleDateString('en-IN', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });
  const checkOutDate = new Date(booking.checkOut).toLocaleDateString('en-IN', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });
  const invoiceNo = booking._id ? booking._id.toString().toUpperCase().slice(-8) : 'TEMP';

  const roomBaseTotal = booking.totalAmount - (booking.addons ? booking.addons.reduce((sum, addon) => sum + addon.price, 0) : 0);
  const roomPricePerNight = Math.round(roomBaseTotal / ((booking.roomsCount || 1) * nights));

  // Build addons HTML if any
  let addonsRows = '';
  if (booking.addons && booking.addons.length > 0) {
    addonsRows = booking.addons.map(addon => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px 0; font-size: 14px; color: #1a1d20;">
          <span style="font-weight: 500;">Addon: ${addon.name}</span>
        </td>
        <td align="center" style="padding: 12px 0; font-size: 14px; color: #1a1d20;">1</td>
        <td align="right" style="padding: 12px 0; font-size: 14px; color: #1a1d20;">₹${addon.price.toLocaleString('en-IN')}</td>
        <td align="right" style="padding: 12px 0; font-size: 14px; font-weight: 600; color: #1a1d20;">₹${addon.price.toLocaleString('en-IN')}</td>
      </tr>
    `).join('');
  }

  // Build Special Requests HTML if any
  let specialRequestsHtml = '';
  if (booking.specialRequests && booking.specialRequests.trim() !== '') {
    specialRequestsHtml = `
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fffbeb; border-radius: 8px; border: 1px solid #fde68a; margin-bottom: 30px;">
        <tr>
          <td style="padding: 15px;">
            <strong style="color: #92400e; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Special Request Note</strong>
            <p style="margin: 0; font-size: 13px; color: #b45309; line-height: 1.5;">"${booking.specialRequests}"</p>
          </td>
        </tr>
      </table>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Booking Invoice</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Outfit', 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f6f8; padding: 40px 10px;">
        <tr>
          <td align="center">
            <!-- Main Card Container -->
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e1e8ed;">
              
              <!-- Header Band -->
              <tr>
                <td style="background-color: #1a1d20; padding: 30px 40px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td>
                        <span style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 2px; text-transform: uppercase;">THE BALIFIED VILLA</span>
                      </td>
                      <td align="right">
                        <span style="font-size: 12px; font-weight: 600; color: #c5a880; letter-spacing: 1.5px; text-transform: uppercase;">BOOKING INVOICE</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Content Padding -->
              <tr>
                <td style="padding: 40px;">
                  
                  <!-- Greeting & Status -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                    <tr>
                      <td>
                        <h2 style="margin: 0 0 10px 0; font-size: 22px; color: #1a1d20; font-weight: 600;">Thank You for Your Booking!</h2>
                        <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">Dear ${user.name}, your reservation at The Balified Villa has been successfully confirmed. Below are your invoice details.</p>
                      </td>
                    </tr>
                  </table>

                  <!-- Invoice Meta / Bill To -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 40px;">
                    <tr>
                      <!-- Bill To (Left) -->
                      <td width="50%" valign="top" style="padding-right: 15px;">
                        <h4 style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; color: #c5a880; letter-spacing: 1px; font-weight: 700;">Billed To</h4>
                        <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #1a1d20;">${user.name}</p>
                        <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748b;">${user.email}</p>
                        <p style="margin: 0; font-size: 13px; color: #64748b;">${user.phone || 'N/A'}</p>
                      </td>
                      <!-- Invoice Details (Right) -->
                      <td width="50%" valign="top" style="padding-left: 15px; text-align: right;">
                        <h4 style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; color: #c5a880; letter-spacing: 1px; font-weight: 700;">Invoice Details</h4>
                        <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748b;"><strong style="color: #1a1d20;">Invoice No:</strong> #TBV-${invoiceNo}</p>
                        <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748b;"><strong style="color: #1a1d20;">Date:</strong> ${invoiceDate}</p>
                        <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;"><strong style="color: #1a1d20;">Payment:</strong> Razorpay</p>
                        <div>
                          <span style="background-color: #e6f7ed; color: #27ae60; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #c2ebd0;">PAID</span>
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- Booking details section -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
                    <tr>
                      <td style="padding: 20px;">
                        <h3 style="margin: 0 0 15px 0; font-size: 14px; color: #1a1d20; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Booking Information</h3>
                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                          <tr>
                            <td width="50%" style="padding-bottom: 12px; font-size: 13px; color: #64748b;">
                              <strong style="color: #1a1d20; display: block; margin-bottom: 2px;">Accommodation</strong>
                              ${primaryRoomDetails.name}
                            </td>
                            <td width="50%" style="padding-bottom: 12px; font-size: 13px; color: #64748b;">
                              <strong style="color: #1a1d20; display: block; margin-bottom: 2px;">Rooms Booked</strong>
                              ${booking.roomsCount || 1} Room(s)
                            </td>
                          </tr>
                          <tr>
                            <td width="50%" style="padding-bottom: 12px; font-size: 13px; color: #64748b;">
                              <strong style="color: #1a1d20; display: block; margin-bottom: 2px;">Check-In Date</strong>
                              ${checkInDate}
                            </td>
                            <td width="50%" style="padding-bottom: 12px; font-size: 13px; color: #64748b;">
                              <strong style="color: #1a1d20; display: block; margin-bottom: 2px;">Check-Out Date</strong>
                              ${checkOutDate}
                            </td>
                          </tr>
                          <tr>
                            <td width="50%" style="font-size: 13px; color: #64748b;">
                              <strong style="color: #1a1d20; display: block; margin-bottom: 2px;">Duration</strong>
                              ${nights} Night(s)
                            </td>
                            <td width="50%" style="font-size: 13px; color: #64748b;">
                              <strong style="color: #1a1d20; display: block; margin-bottom: 2px;">Guests</strong>
                              ${booking.adults} Adults, ${booking.children || 0} Children
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Charges Table -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 45px;">
                    <thead>
                      <tr>
                        <th align="left" style="padding-bottom: 12px; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0; letter-spacing: 0.5px;">Description</th>
                        <th align="center" style="padding-bottom: 12px; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0; letter-spacing: 0.5px; width: 60px;">Qty</th>
                        <th align="right" style="padding-bottom: 12px; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0; letter-spacing: 0.5px; width: 100px;">Rate</th>
                        <th align="right" style="padding-bottom: 12px; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0; letter-spacing: 0.5px; width: 120px;">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <!-- Room Charges Row -->
                      <tr>
                        <td style="padding: 16px 0; font-size: 14px; color: #1a1d20; border-bottom: 1px solid #f1f5f9; vertical-align: top;">
                          <span style="font-weight: 600;">Room Accommodation</span><br/>
                          <span style="font-size: 12px; color: #64748b;">${primaryRoomDetails.name} - ${nights} Night(s)</span>
                        </td>
                        <td align="center" style="padding: 16px 0; font-size: 14px; color: #1a1d20; border-bottom: 1px solid #f1f5f9; vertical-align: top;">${booking.roomsCount || 1}</td>
                        <td align="right" style="padding: 16px 0; font-size: 14px; color: #1a1d20; border-bottom: 1px solid #f1f5f9; vertical-align: top;">₹${roomPricePerNight.toLocaleString('en-IN')}</td>
                        <td align="right" style="padding: 16px 0; font-size: 14px; font-weight: 600; color: #1a1d20; border-bottom: 1px solid #f1f5f9; vertical-align: top;">₹${roomBaseTotal.toLocaleString('en-IN')}</td>
                      </tr>
                      
                      <!-- Addons Rows -->
                      ${addonsRows}

                      <!-- Summary Calculations -->
                      <tr>
                        <td colspan="2"></td>
                        <td align="right" style="padding: 16px 0 8px 0; font-size: 14px; color: #64748b;">Subtotal:</td>
                        <td align="right" style="padding: 16px 0 8px 0; font-size: 14px; font-weight: 600; color: #1a1d20;">₹${booking.totalAmount.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td colspan="2"></td>
                        <td align="right" style="padding: 0 0 8px 0; font-size: 14px; color: #64748b;">Tax & Service Fee:</td>
                        <td align="right" style="padding: 0 0 8px 0; font-size: 13px; color: #64748b; font-style: italic;">Included</td>
                      </tr>
                      <tr>
                        <td colspan="2"></td>
                        <td align="right" style="padding: 12px 0 0 0; border-top: 2px double #e2e8f0; font-size: 15px; font-weight: 700; color: #1a1d20;">Total Paid:</td>
                        <td align="right" style="padding: 12px 0 0 0; border-top: 2px double #e2e8f0; font-size: 18px; font-weight: 700; color: #c5a880;">₹${booking.totalAmount.toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>

                  <!-- Special Requests if any -->
                  ${specialRequestsHtml}


                </td>
              </tr>

              <!-- Footer Band -->
              <tr>
                <td style="background-color: #1a1d20; padding: 40px 40px 30px 40px; text-align: center; border-top: 1px solid #2e343b;">
                  <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #ffffff; letter-spacing: 2px;">THE BALIFIED VILLA</p>
                  <p style="margin: 0 0 25px 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                    Jalan Luxury Villa No. 8, Seminyak, Bali, Indonesia<br/>
                    Tel: +62 361 123456 | Email: info@jhonhotel.com
                  </p>
                  <table align="center" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td>
                        <a href="https://thebalifiedvilla.com" style="display: inline-block; font-size: 11px; color: #c5a880; text-decoration: none; font-weight: 600; border: 1px solid #c5a880; padding: 8px 24px; border-radius: 4px; letter-spacing: 0.5px; text-transform: uppercase;">Visit Website</a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 30px 0 0 0; font-size: 10px; color: #475569;">&copy; 2026 The Balified Villa. All rights reserved.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export const getAdminBookingEmailTemplate = (user, booking, primaryRoomDetails) => {
  const nights = Math.max(1, Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24)));
  const bookingDate = new Date(booking.createdAt || Date.now()).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const checkInDate = new Date(booking.checkIn).toLocaleDateString('en-IN', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });
  const checkOutDate = new Date(booking.checkOut).toLocaleDateString('en-IN', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });
  const bookingRef = booking._id ? booking._id.toString().toUpperCase().slice(-8) : 'TEMP';

  const roomBaseTotal = booking.totalAmount - (booking.addons ? booking.addons.reduce((sum, addon) => sum + addon.price, 0) : 0);
  const roomPricePerNight = Math.round(roomBaseTotal / ((booking.roomsCount || 1) * nights));

  // Build addons HTML if any
  let addonsRows = '';
  if (booking.addons && booking.addons.length > 0) {
    addonsRows = booking.addons.map(addon => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px 0; font-size: 14px; color: #1a1d20;">
          <span style="font-weight: 500;">Addon: ${addon.name}</span>
        </td>
        <td align="center" style="padding: 12px 0; font-size: 14px; color: #1a1d20;">1</td>
        <td align="right" style="padding: 12px 0; font-size: 14px; color: #1a1d20;">₹${addon.price.toLocaleString('en-IN')}</td>
        <td align="right" style="padding: 12px 0; font-size: 14px; font-weight: 600; color: #1a1d20;">₹${addon.price.toLocaleString('en-IN')}</td>
      </tr>
    `).join('');
  }

  // Build Special Requests HTML if any
  let specialRequestsHtml = '';
  if (booking.specialRequests && booking.specialRequests.trim() !== '') {
    specialRequestsHtml = `
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fffbeb; border-radius: 8px; border: 1px solid #fde68a; margin-bottom: 30px;">
        <tr>
          <td style="padding: 15px;">
            <strong style="color: #92400e; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Guest Request & Note</strong>
            <p style="margin: 0; font-size: 13px; color: #b45309; line-height: 1.5;">"${booking.specialRequests}"</p>
          </td>
        </tr>
      </table>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Booking Notification</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Outfit', 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f6f8; padding: 40px 10px;">
        <tr>
          <td align="center">
            <!-- Main Card Container -->
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e1e8ed;">
              
              <!-- Header Band -->
              <tr>
                <td style="background-color: #1a1d20; padding: 30px 40px; border-bottom: 3px solid #c5a880;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td>
                        <span style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 2px; text-transform: uppercase;">THE BALIFIED VILLA</span>
                      </td>
                      <td align="right">
                        <span style="font-size: 12px; font-weight: 600; color: #e11d48; letter-spacing: 1.5px; text-transform: uppercase;">NEW BOOKING ALERT</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Content Padding -->
              <tr>
                <td style="padding: 40px;">
                  
                  <!-- Title -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                    <tr>
                      <td>
                        <h2 style="margin: 0 0 10px 0; font-size: 22px; color: #1a1d20; font-weight: 600;">New Booking Received</h2>
                        <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">Hello Admin, a new reservation has been made and successfully paid. Here are the booking details:</p>
                      </td>
                    </tr>
                  </table>

                  <!-- Booking Meta / Guest Info -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 40px;">
                    <tr>
                      <!-- Guest Details (Left) -->
                      <td width="50%" valign="top" style="padding-right: 15px;">
                        <h4 style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; color: #c5a880; letter-spacing: 1px; font-weight: 700;">Guest Details</h4>
                        <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #1a1d20;">${user.name}</p>
                        <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748b;"><strong>Email:</strong> ${user.email}</p>
                        <p style="margin: 0; font-size: 13px; color: #64748b;"><strong>Phone:</strong> ${user.phone || 'N/A'}</p>
                      </td>
                      <!-- Booking Details (Right) -->
                      <td width="50%" valign="top" style="padding-left: 15px; text-align: right;">
                        <h4 style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; color: #c5a880; letter-spacing: 1px; font-weight: 700;">Booking Metadata</h4>
                        <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748b;"><strong style="color: #1a1d20;">Reference ID:</strong> #TBV-${bookingRef}</p>
                        <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748b;"><strong style="color: #1a1d20;">Booking Date:</strong> ${bookingDate}</p>
                        <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;"><strong style="color: #1a1d20;">Status:</strong> Confirmed</p>
                        <div>
                          <span style="background-color: #e0f2fe; color: #0284c7; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #bae6fd;">PAYMENT PAID</span>
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- Booking details section -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
                    <tr>
                      <td style="padding: 20px;">
                        <h3 style="margin: 0 0 15px 0; font-size: 14px; color: #1a1d20; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Reservation Information</h3>
                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                          <tr>
                            <td width="50%" style="padding-bottom: 12px; font-size: 13px; color: #64748b;">
                              <strong style="color: #1a1d20; display: block; margin-bottom: 2px;">Accommodation</strong>
                              ${primaryRoomDetails.name}
                            </td>
                            <td width="50%" style="padding-bottom: 12px; font-size: 13px; color: #64748b;">
                              <strong style="color: #1a1d20; display: block; margin-bottom: 2px;">Rooms Booked</strong>
                              ${booking.roomsCount || 1} Room(s)
                            </td>
                          </tr>
                          <tr>
                            <td width="50%" style="padding-bottom: 12px; font-size: 13px; color: #64748b;">
                              <strong style="color: #1a1d20; display: block; margin-bottom: 2px;">Check-In Date</strong>
                              ${checkInDate}
                            </td>
                            <td width="50%" style="padding-bottom: 12px; font-size: 13px; color: #64748b;">
                              <strong style="color: #1a1d20; display: block; margin-bottom: 2px;">Check-Out Date</strong>
                              ${checkOutDate}
                            </td>
                          </tr>
                          <tr>
                            <td width="50%" style="font-size: 13px; color: #64748b;">
                              <strong style="color: #1a1d20; display: block; margin-bottom: 2px;">Duration</strong>
                              ${nights} Night(s)
                            </td>
                            <td width="50%" style="font-size: 13px; color: #64748b;">
                              <strong style="color: #1a1d20; display: block; margin-bottom: 2px;">Guests</strong>
                              ${booking.adults} Adults, ${booking.children || 0} Children
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Charges Table -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 45px;">
                    <thead>
                      <tr>
                        <th align="left" style="padding-bottom: 12px; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0; letter-spacing: 0.5px;">Description</th>
                        <th align="center" style="padding-bottom: 12px; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0; letter-spacing: 0.5px; width: 60px;">Qty</th>
                        <th align="right" style="padding-bottom: 12px; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0; letter-spacing: 0.5px; width: 100px;">Rate</th>
                        <th align="right" style="padding-bottom: 12px; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0; letter-spacing: 0.5px; width: 120px;">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <!-- Room Charges Row -->
                      <tr>
                        <td style="padding: 16px 0; font-size: 14px; color: #1a1d20; border-bottom: 1px solid #f1f5f9; vertical-align: top;">
                          <span style="font-weight: 600;">Room Accommodation</span><br/>
                          <span style="font-size: 12px; color: #64748b;">${primaryRoomDetails.name} - ${nights} Night(s)</span>
                        </td>
                        <td align="center" style="padding: 16px 0; font-size: 14px; color: #1a1d20; border-bottom: 1px solid #f1f5f9; vertical-align: top;">${booking.roomsCount || 1}</td>
                        <td align="right" style="padding: 16px 0; font-size: 14px; color: #1a1d20; border-bottom: 1px solid #f1f5f9; vertical-align: top;">₹${roomPricePerNight.toLocaleString('en-IN')}</td>
                        <td align="right" style="padding: 16px 0; font-size: 14px; font-weight: 600; color: #1a1d20; border-bottom: 1px solid #f1f5f9; vertical-align: top;">₹${roomBaseTotal.toLocaleString('en-IN')}</td>
                      </tr>
                      
                      <!-- Addons Rows -->
                      ${addonsRows}

                      <!-- Summary Calculations -->
                      <tr>
                        <td colspan="2"></td>
                        <td align="right" style="padding: 16px 0 8px 0; font-size: 14px; color: #64748b;">Revenue collected:</td>
                        <td align="right" style="padding: 16px 0 8px 0; font-size: 14px; font-weight: 600; color: #27ae60;">₹${booking.totalAmount.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td colspan="2"></td>
                        <td align="right" style="padding: 0 0 8px 0; font-size: 14px; color: #64748b;">Gateway:</td>
                        <td align="right" style="padding: 0 0 8px 0; font-size: 13px; color: #64748b;">Razorpay (Paid)</td>
                      </tr>
                      <tr>
                        <td colspan="2"></td>
                        <td align="right" style="padding: 12px 0 0 0; border-top: 2px double #e2e8f0; font-size: 15px; font-weight: 700; color: #1a1d20;">Grand Total:</td>
                        <td align="right" style="padding: 12px 0 0 0; border-top: 2px double #e2e8f0; font-size: 18px; font-weight: 700; color: #1a1d20;">₹${booking.totalAmount.toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>

                  <!-- Special Requests if any -->
                  ${specialRequestsHtml}

                  <!-- Actions / Info Section -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 25px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                    <tr>
                      <td>
                        <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.6;">
                          <strong>Action Required:</strong> Please ensure the rooms are blocked in internal calendars and prepared for check-in on the selected dates.
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              <!-- Footer Band -->
              <tr>
                <td style="background-color: #1a1d20; padding: 30px 40px; text-align: center; border-top: 1px solid #2e343b;">
                  <p style="margin: 0 0 10px 0; font-size: 13px; color: #94a3b8; letter-spacing: 1px;">THE BALIFIED VILLA - ADMIN ALERTS</p>
                  <p style="margin: 0; font-size: 11px; color: #475569;">This is an automated operational email. Please do not reply directly to this message.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export const getCancelBookingEmailTemplate = (user, booking, primaryRoomDetails) => {
  const invoiceNo = booking._id ? booking._id.toString().toUpperCase().slice(-8) : 'TEMP';
  const checkInDate = new Date(booking.checkIn).toLocaleDateString('en-IN', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });
  const checkOutDate = new Date(booking.checkOut).toLocaleDateString('en-IN', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Booking Cancellation Confirmed</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Outfit', 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f6f8; padding: 40px 10px;">
        <tr>
          <td align="center">
            <!-- Main Card Container -->
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e1e8ed;">
              
              <!-- Header Band -->
              <tr>
                <td style="background-color: #e11d48; padding: 30px 40px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td>
                        <span style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 2px; text-transform: uppercase;">THE BALIFIED VILLA</span>
                      </td>
                      <td align="right">
                        <span style="font-size: 12px; font-weight: 600; color: #ffffff; letter-spacing: 1.5px; text-transform: uppercase;">CANCELLATION CONFIRMED</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Content Padding -->
              <tr>
                <td style="padding: 40px;">
                  
                  <!-- Greeting & Status -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                    <tr>
                      <td>
                        <h2 style="margin: 0 0 10px 0; font-size: 22px; color: #1a1d20; font-weight: 600;">Your Booking Has Been Cancelled</h2>
                        <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">Dear ${user.name}, this email confirms that your booking (Ref: <strong>#TBV-${invoiceNo}</strong>) at The Balified Villa has been cancelled successfully.</p>
                      </td>
                    </tr>
                  </table>

                  <!-- Refund Info Banner -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fef2f2; border-radius: 8px; border: 1px solid #fecaca; margin-bottom: 30px;">
                    <tr>
                      <td style="padding: 15px;">
                        <strong style="color: #991b1b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Refund Information</strong>
                        <p style="margin: 0; font-size: 14px; color: #b91c1c; line-height: 1.5; font-weight: 500;">
                          A full refund of <strong>₹${booking.totalAmount.toLocaleString('en-IN')}</strong> has been approved. The refund will be credited back to your original payment method within <strong>3 to 4 working days</strong>.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Booking details section -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 30px;">
                    <tr>
                      <td style="padding: 20px;">
                        <h3 style="margin: 0 0 15px 0; font-size: 13px; color: #1a1d20; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Cancelled Booking Details</h3>
                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                          <tr>
                            <td width="50%" style="padding-bottom: 12px; font-size: 13px; color: #64748b;">
                              <strong style="color: #1a1d20; display: block; margin-bottom: 2px;">Accommodation</strong>
                              ${primaryRoomDetails.name}
                            </td>
                            <td width="50%" style="padding-bottom: 12px; font-size: 13px; color: #64748b;">
                              <strong style="color: #1a1d20; display: block; margin-bottom: 2px;">Check-In Date</strong>
                              ${checkInDate}
                            </td>
                          </tr>
                          <tr>
                            <td width="50%" style="font-size: 13px; color: #64748b;">
                              <strong style="color: #1a1d20; display: block; margin-bottom: 2px;">Check-Out Date</strong>
                              ${checkOutDate}
                            </td>
                            <td width="50%" style="font-size: 13px; color: #64748b;">
                              <strong style="color: #1a1d20; display: block; margin-bottom: 2px;">Total Refund Amount</strong>
                              ₹${booking.totalAmount.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">
                    If you have any questions or did not authorize this cancellation, please contact our support team immediately at info@jhonhotel.com.
                  </p>

                </td>
              </tr>

              <!-- Footer Band -->
              <tr>
                <td style="background-color: #1a1d20; padding: 40px 40px 30px 40px; text-align: center; border-top: 1px solid #2e343b;">
                  <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #ffffff; letter-spacing: 2px;">THE BALIFIED VILLA</p>
                  <p style="margin: 0 0 25px 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                    Jalan Luxury Villa No. 8, Seminyak, Bali, Indonesia<br/>
                    Tel: +62 361 123456 | Email: info@jhonhotel.com
                  </p>
                  <p style="margin: 0; font-size: 10px; color: #475569;">&copy; 2026 The Balified Villa. All rights reserved.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export const getRefundEmailTemplate = (user, booking, primaryRoomDetails) => {
  const invoiceNo = booking._id ? booking._id.toString().toUpperCase().slice(-8) : 'TEMP';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Refund Processed</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Outfit', 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f6f8; padding: 40px 10px;">
        <tr>
          <td align="center">
            <!-- Main Card Container -->
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e1e8ed;">
              
              <!-- Header Band -->
              <tr>
                <td style="background-color: #10b981; padding: 30px 40px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td>
                        <span style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 2px; text-transform: uppercase;">THE BALIFIED VILLA</span>
                      </td>
                      <td align="right">
                        <span style="font-size: 12px; font-weight: 600; color: #ffffff; letter-spacing: 1.5px; text-transform: uppercase;">REFUND SUCCESSFUL</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Content Padding -->
              <tr>
                <td style="padding: 40px;">
                  
                  <!-- Greeting & Status -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                    <tr>
                      <td>
                        <h2 style="margin: 0 0 10px 0; font-size: 22px; color: #1a1d20; font-weight: 600;">Refund Has Been Processed</h2>
                        <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">Dear ${user.name}, we have successfully processed your refund of <strong>₹${booking.totalAmount.toLocaleString('en-IN')}</strong> for the cancelled booking (Ref: <strong>#TBV-${invoiceNo}</strong>).</p>
                      </td>
                    </tr>
                  </table>

                  <!-- Confirmation Banner -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ecfdf5; border-radius: 8px; border: 1px solid #a7f3d0; margin-bottom: 30px;">
                    <tr>
                      <td style="padding: 15px;">
                        <strong style="color: #065f46; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Transaction Status</strong>
                        <p style="margin: 0; font-size: 14px; color: #047857; line-height: 1.5; font-weight: 500;">
                          The refund amount has been released to your account. Depending on your financial institution, it may take 1-3 business days to reflect in your bank statement.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Details -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 30px;">
                    <tr>
                      <td style="padding: 20px;">
                        <h3 style="margin: 0 0 15px 0; font-size: 13px; color: #1a1d20; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Refund Summary</h3>
                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                          <tr>
                            <td width="50%" style="font-size: 13px; color: #64748b;">
                              <strong style="color: #1a1d20; display: block; margin-bottom: 2px;">Booking Ref ID</strong>
                              #TBV-${invoiceNo}
                            </td>
                            <td width="50%" style="font-size: 13px; color: #64748b;">
                              <strong style="color: #1a1d20; display: block; margin-bottom: 2px;">Refunded Amount</strong>
                              ₹${booking.totalAmount.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">
                    Thank you for your patience and understanding. We hope to welcome you back to The Balified Villa in the near future.
                  </p>

                </td>
              </tr>

              <!-- Footer Band -->
              <tr>
                <td style="background-color: #1a1d20; padding: 40px 40px 30px 40px; text-align: center; border-top: 1px solid #2e343b;">
                  <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #ffffff; letter-spacing: 2px;">THE BALIFIED VILLA</p>
                  <p style="margin: 0 0 25px 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                    Jalan Luxury Villa No. 8, Seminyak, Bali, Indonesia<br/>
                    Tel: +62 361 123456 | Email: info@jhonhotel.com
                  </p>
                  <p style="margin: 0; font-size: 10px; color: #475569;">&copy; 2026 The Balified Villa. All rights reserved.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

