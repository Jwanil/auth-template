import nodemailer from 'nodemailer';

// Create email transport using Gmail
const createTransport = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD // Use app password for Gmail
    }
  });
};

export const sendOTP = async (email, otp) => {
  try {
    // Use real Gmail account instead of test account
    const transporter = createTransport();
    
    const info = await transporter.sendMail({
      from: '"Security Team" <jwanilmodi10@gmail.com>', // Update with your email
      to: email,
      subject: 'Your One-Time Password (OTP)',
      text: `Your OTP for login is: ${otp}. It will expire in 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your One-Time Password</h2>
          <p>Use the following code to complete your login:</p>
          <div style="background-color: #f4f4f4; padding: 15px; font-size: 24px; text-align: center; letter-spacing: 5px; font-weight: bold;">
            ${otp}
          </div>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });
    
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Add new function for password reset emails
export const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const transporter = createTransport();
    
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    
    const info = await transporter.sendMail({
      from: '"Security Team" <jwanilmodi10@gmail.com>', // Same sender as OTP emails
      to: email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Please use the following code to reset your password: ${resetToken}. This code will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your account.</p>
          <p>Please use the following code to reset your password:</p>
          <div style="background-color: #f4f4f4; padding: 15px; font-size: 24px; text-align: center; letter-spacing: 5px; font-weight: bold;">
            ${resetToken}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
        </div>
      `,
    });
    
    console.log('Password reset email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

