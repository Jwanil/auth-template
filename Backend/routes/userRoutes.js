import express from 'express';
import User from '../models/userModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendOTP, sendPasswordResetEmail } from '../services/emailService.js';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library'; // Add this import

const router = express.Router();

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Check if username already exists
    const usernameExists = await User.findOne({ name });
    if (usernameExists) {
      return res.status(400).json({ message: 'Username already taken' });
    }
    
    // Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    // Validate password complexity
    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters and include at least one uppercase letter, one number, and one special character' 
      });
    }
    
    // Validate email domain
    const validDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'aol.com', 'protonmail.com', 'mail.com'];
    const emailDomain = email.split('@')[1];
    if (!validDomains.includes(emailDomain)) {
      return res.status(400).json({ 
        message: 'Please use a common email domain (gmail.com, yahoo.com, outlook.com, etc.)' 
      });
    }
    
    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      loginMethod: 'manual'
    });
    
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Server error during registration', 
      error: error.message 
    });
  }
});

// Login user - Step 1: Verify credentials and send OTP
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const deviceToken = req.cookies?.deviceToken;
    
    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { name: identifier }
      ]
    });
    
    // Check if user exists and password matches
    if (user && (await user.matchPassword(password))) {
      // Check if this is a trusted device
      const isTrustedDevice = user.trustedDevices.some(device => device.token === deviceToken);
      
      if (isTrustedDevice) {
        // Skip OTP for trusted device
        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          token: generateToken(user._id)
        });
      }
      
      // Always generate OTP for non-trusted devices (regardless of 2FA setting)
      const otp = await user.generateOTP();
      
      // Send OTP via email
      await sendOTP(user.email, otp);
      
      return res.status(200).json({
        message: 'OTP sent to your email',
        requireOTP: true,
        userId: user._id
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login user - Step 2: Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp, rememberDevice } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify OTP
    const isValid = await user.verifyOTP(otp);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }
    
    // If remember device is checked, create a trusted device token
    if (rememberDevice) {
      const deviceToken = uuidv4();
      
      // Add to trusted devices
      user.trustedDevices.push({
        token: deviceToken,
        deviceInfo: req.headers['user-agent'] || 'Unknown device',
        createdAt: new Date()
      });
      
      await user.save();
      
      // Set cookie for the trusted device
      res.cookie('deviceToken', deviceToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
    }
    
    // Clear the OTP after successful verification
    user.twoFACode = null;
    user.twoFACodeExpiry = null;
    await user.save();
    
    // Return user info with token
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Enable 2FA
router.post('/enable-2fa', async (req, res) => {
  try {
    const { userId, password } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify password for security
    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    
    // Generate and send OTP for verification
    const otp = await user.generateOTP();
    await sendOTP(user.email, otp);
    
    res.status(200).json({
      message: 'OTP sent to your email. Please verify to enable 2FA.',
      requireOTP: true
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify OTP and enable 2FA
router.post('/confirm-enable-2fa', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify OTP
    const isValid = await user.verifyOTP(otp);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }
    
    // Enable 2FA
    user.twoFAEnabled = true;
    user.twoFACode = null;
    user.twoFACodeExpiry = null;
    await user.save();
    
    res.status(200).json({
      message: 'Two-factor authentication enabled successfully',
      twoFAEnabled: true
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Disable 2FA
router.post('/disable-2fa', async (req, res) => {
  try {
    const { userId, password } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify password for security
    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    
    // Disable 2FA
    user.twoFAEnabled = false;
    user.twoFACode = null;
    user.twoFACodeExpiry = null;
    await user.save();
    
    res.status(200).json({
      message: 'Two-factor authentication disabled successfully',
      twoFAEnabled: false
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users (for admin purposes)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}).select('-password -twoFACode'); // Exclude sensitive fields
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user settings
router.get('/settings/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -twoFACode');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      twoFAEnabled: user.twoFAEnabled,
      email: user.email,
      name: user.name,
      loginMethod: user.loginMethod
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a user
router.delete('/delete/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await User.deleteOne({ _id: req.params.id });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete all users (for testing purposes only)
router.delete('/delete-all', async (req, res) => {
  try {
    await User.deleteMany({});
    res.json({ message: 'All users deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Google login - First step: Verify Google token
router.post('/google-login', async (req, res) => {
  try {
    const { token, username, password } = req.body;
    
    // Verify the token with Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { email, sub: googleId } = payload;
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (!user) {
      // If username and password are provided, create new user
      if (username && password) {
        // Validate username uniqueness
        const usernameExists = await User.findOne({ name: username });
        if (usernameExists) {
          return res.status(400).json({ message: 'Username already taken' });
        }
        
        // Validate password complexity
        const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
        if (!passwordRegex.test(password)) {
          return res.status(400).json({ 
            message: 'Password must be at least 8 characters and include at least one uppercase letter, one number, and one special character' 
          });
        }
        
        // Create new user with provided username and password
        user = await User.create({
          name: username,
          email,
          password, // Will be hashed by pre-save hook
          googleId,
          loginMethod: 'google'
        });
        
        // Return user info with token
        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          token: generateToken(user._id)
        });
      } else {
        // If username and password not provided, return error with needsProfile flag
        return res.status(200).json({
          needsProfile: true,
          email,
          googleId
        });
      }
    } else {
      // Update existing user with Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
      
      // Return user info with token
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add these routes after your existing routes

// Forgot Password - Step 1: Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }
    
    // Generate a 6-digit reset token
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash the reset token
    const salt = await bcrypt.genSalt(10);
    user.twoFACode = await bcrypt.hash(resetToken, salt);
    
    // Set expiry to 10 minutes from now
    user.twoFACodeExpiry = new Date(Date.now() + 10 * 60 * 1000);
    
    await user.save();
    
    // Send password reset email
    await sendPasswordResetEmail(user.email, resetToken);
    
    res.status(200).json({ 
      message: 'Password reset code has been sent to your email' 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Forgot Password - Step 2: Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if reset token exists and is not expired
    if (!user.twoFACode || !user.twoFACodeExpiry) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
    }
    
    if (user.twoFACodeExpiry < new Date()) {
      return res.status(400).json({ message: 'Password reset token has expired' });
    }
    
    // Verify reset token
    const isValid = await bcrypt.compare(token, user.twoFACode);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid reset token' });
    }
    
    // Validate password complexity
    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters and include at least one uppercase letter, one number, and one special character' 
      });
    }
    
    // Update password
    user.password = newPassword; // Will be hashed by pre-save hook
    
    // Clear reset token fields
    user.twoFACode = null;
    user.twoFACodeExpiry = null;
    
    await user.save();
    
    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Replace this line
// router.post('/resend-otp', userController.resendOTP);

// With this implementation
router.post('/resend-otp', async (req, res) => {
  try { 
    const { userId } = req.body; 
    
    // Find the user 
    const user = await User.findById(userId); 
    if (!user) { 
      return res.status(404).json({ message: 'User not found' }); 
    } 
    
    // Generate new OTP using the existing method in userModel
    const otp = await user.generateOTP(); 
    
    // Send email with new OTP using the existing emailService
    await sendOTP(user.email, otp); 
    
    res.status(200).json({ message: 'OTP has been resent to your email' }); 
  } catch (error) { 
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error' }); 
  } 
});

// Make sure to add the export default at the end of the file
export default router;
