import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  try {
    // Create a transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // User email from .env
        pass: process.env.EMAIL_PASS, // App password from .env
      },
    });

    // Define the email options
    const mailOptions = {
      from: `The Balified Villa <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

export default sendEmail;
