const authService = require('./authService'); // Assuming you create this file
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_AUTH_CLIENT_ID);
const User = require('../models/user');
const NotificationService = require('../services/notificationService');

const signup = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const { user, token } = await authService.signup(email, username, password);

    NotificationService.sendWelcomeEmail(user);
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to signup' });
  }
};

// Login controller
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const { user, token } = await authService.login(email, password);
    res.status(200).json({ user, token });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Invalid credentials' }); // Or 500 depending on the error
  }
};

const googleLogin = async (req, res) => {
  const { idToken } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_AUTH_CLIENT_ID, 
    });
    const payload = ticket.getPayload();
    
    // payload contains: email, name, picture, sub (unique google id)
    const { email, name, picture, sub } = payload;

    // 1. Find or Create User in your DB
    let user = await User.findOne({ where: { email } });
    if (!user) {
      user = await User.create({ 
        username: name, 
        email, 
        googleId: sub,
        profilePicture: picture,
        role: 'seeker' // Default role, adjust as needed
      });
    }

    // 2. Generate your own JWT for the session
    const token = authService.generateToken(user);
    res.json({ user, token });

  } catch (error) {
    console.log('Google login error: ', error);
    res.status(401).json({ message: 'Invalid Google Token' });
  }
};

module.exports = { signup, login, googleLogin };