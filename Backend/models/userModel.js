import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function(v) {
          return /^[^\s@]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com|icloud\.com|aol\.com|protonmail\.com|mail\.com)$/i.test(v);
        },
        message: props => `${props.value} is not a valid email. Please use a common email domain like gmail.com, yahoo.com, outlook.com, etc.`
      }
    },
    password: {
      type: String,
      required: true,
    },
    // New fields for 2FA
    twoFAEnabled: {
      type: Boolean,
      default: false
    },
    twoFACode: {
      type: String,
      default: null
    },
    twoFACodeExpiry: {
      type: Date,
      default: null
    },
    loginMethod: {
      type: String,
      enum: ['manual', 'google'],
      default: 'manual'
    },
    googleId: {
      type: String,
      default: null
    },
    trustedDevices: [
      {
        token: String,
        deviceInfo: String,
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to check if entered password matches the hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate OTP for 2FA
userSchema.methods.generateOTP = async function() {
  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Hash the OTP
  const salt = await bcrypt.genSalt(10);
  this.twoFACode = await bcrypt.hash(otp, salt);
  
  // Set expiry to 5 minutes from now
  this.twoFACodeExpiry = new Date(Date.now() + 5 * 60 * 1000);
  
  await this.save();
  
  return otp;
};

// Method to verify OTP
userSchema.methods.verifyOTP = async function(enteredOTP) {
  // Check if OTP is expired
  if (this.twoFACodeExpiry < new Date()) {
    return false;
  }
  
  // Compare entered OTP with stored hash
  return await bcrypt.compare(enteredOTP, this.twoFACode);
};

const User = mongoose.model('User', userSchema);

export default User;