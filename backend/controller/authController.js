// Add these new endpoints to your backend authController.js

// @desc    Send reset code to email
// @route   POST /api/auth/forgot-password
const sendResetCode = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      // For security, don't reveal if email exists
      return res.json({
        success: true,
        message: 'If your email exists, a reset code has been sent.'
      });
    }
    
    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save code to database with expiry
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetCode)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await user.save();
    
    // Send email with code
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Password Reset Code</h2>
        <p>You requested to reset your password. Use the code below:</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; border-radius: 8px;">
          ${resetCode}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <hr />
        <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    `;
    
    await sendEmail({
      email,
      subject: 'Password Reset Code - SEMS',
      html,
    });
    
    res.json({
      success: true,
      message: 'Reset code sent to your email'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Verify reset code
// @route   POST /api/auth/verify-reset-code
const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    
    const user = await User.findOne({
      email,
      resetPasswordToken: hashedCode,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code'
      });
    }
    
    res.json({
      success: true,
      message: 'Code verified successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Reset password with code
// @route   POST /api/auth/reset-password-with-code
const resetPasswordWithCode = async (req, res) => {
  try {
    const { email, code, password } = req.body;
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    
    const user = await User.findOne({
      email,
      resetPasswordToken: hashedCode,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code'
      });
    }
    
    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};