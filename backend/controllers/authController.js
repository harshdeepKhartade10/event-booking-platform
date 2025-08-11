const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const sendVerificationEmail = async (user, req) => {
  const code = user.verificationToken;
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email`;
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Verify your email',
    html: `<p>Welcome to our platform!</p>
      <p>Please verify your email address by clicking the link below and entering the code provided:</p>
      <p style="margin:1.2em 0;"><a href="${verifyUrl}" style="font-size:1.1em;color:#1a73e8;">Verify Email</a></p>
      <p>Verification code (case-sensitive):</p>
      <p style="font-size:1.4em;"><b>${code}</b></p>
      <p>If you did not request this, you can ignore this email.</p>`
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' });
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'Email already registered' });
    // Generate an 8-character random alphanumeric code (mixed case)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let verificationToken = '';
    for (let i = 0; i < 8; ++i) verificationToken += chars.charAt(Math.floor(Math.random() * chars.length));
    user = new User({ name, email, password, verificationToken });
    await user.save();
    await sendVerificationEmail(user, req);
    res.status(201).json({ message: 'Registration successful, please verify your email.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findOne({ verificationToken: code });
    if (!user) return res.status(400).json({ message: 'Invalid or expired code' });
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (!user.isVerified) return res.status(403).json({ message: 'Email not verified' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Include isAdmin in the response
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role,
      isVerified: user.isVerified
    };
    res.json(userData);
  } catch (err) {
    console.error('Error in getProfile:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
