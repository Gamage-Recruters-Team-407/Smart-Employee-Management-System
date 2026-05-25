import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { OAuth2Client } from 'google-auth-library';

import sendEmail from '../utils/sendEmail.js';


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function to generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'Employee',
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data received' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check for user email
    const user = await User.findOne({ email });

    // 2. Verify password
    if (user && (await bcrypt.compare(password, user.password))) {
      res.status(200).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Authenticate user using Google Sign-In
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = async (req, res) => {
  try {
    // Extract the Google token sent by the frontend
    const { token } = req.body; 

    // 1. Verify the token with Google's servers
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    // 2. Extract user information from the verified Google payload
    const payload = ticket.getPayload();
    const { email, name } = payload;

    // 3. Check if this user already exists in our MongoDB database
    let user = await User.findOne({ email });

    // 4. If the user does not exist, automatically create a new account
    if (!user) {
      // Since Google handles the login, we generate a random secure password for the database
      const randomPassword = Math.random().toString(36).slice(-8) + "Aa1@"; 
      
      user = await User.create({
        name: name,
        email: email,
        password: randomPassword,
        role: 'Employee' // Assign the default role for new Google users
      });
    }

    // 5. Generate and send our system's JWT token (whether the user is new or existing)
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role), // Utilizing our existing token generator
    });

  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(401).json({ message: 'Google authentication failed' });
  }
};

// @desc    Forgot Password (Generates 6-digit OTP and sends email)
// @route   POST /api/auth/forgotpassword
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({ message: 'There is no user with that email' });
    }

    // 1. Generate a 6-digit OTP (e.g., 482910)
    const resetOTP = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Save the OTP and expiration time (15 mins) to the database
    user.resetPasswordOTP = resetOTP;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    
    await user.save({ validateBeforeSave: false });

    // 3. Create the email message
    const message = `Your password reset code is: \n\n${resetOTP}\n\nThis code is valid for 15 minutes. Do not share this code with anyone.`;

    // 4. Send the email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Smart Employee System - Password Reset Code',
        message: message,
      });

      res.status(200).json({ message: 'OTP sent to email successfully' });
    } catch (err) {
      user.resetPasswordOTP = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


// @desc    Reset Password (Compares OTP and updates password)
// @route   POST /api/auth/resetpassword
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // 1. Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Check if the OTP matches and if it has not expired
    if (user.resetPasswordOTP !== otp) {
      return res.status(400).json({ message: 'Invalid OTP code' });
    }

    if (user.resetPasswordExpire < Date.now()) {
      return res.status(400).json({ message: 'OTP code has expired. Please request a new one.' });
    }

    // 3. If everything is valid, update the password
    user.password = newPassword;
    
    // 4. Clear the OTP fields from the database so they can't be used again
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpire = undefined;

    await user.save(); // Mongoose will automatically hash the new password before saving!

    res.status(200).json({ message: 'Password has been reset successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};