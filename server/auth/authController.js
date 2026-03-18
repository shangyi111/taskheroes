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
    res.status(201).json({ 
      token, 
      user: { id: user.id, username: user.username, email: user.email } 
    });
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
    res.status(200).json({ 
      token, 
      user: { id: user.id, username: user.username, email: user.email } 
    });
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
   const [user, created] = await User.findOrCreate({
      where: { email },
      defaults: {
        username: name,
        googleId: sub,
        email,
        profilePicture: picture,
        role: 'seeker',
        isIdentityVerified: false
      }
    });

    // If the user already existed but didn't have a googleId (Account Merging)
    if (!created && !user.googleId) {
      user.googleId = sub;
      await user.save();
    }

    // 2. Generate your own JWT for the session
    const token = authService.generateToken(user);
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        profilePicture: user.profilePicture 
      }  
    });

  } catch (error) {
    console.log('Google login error: ', error);
    res.status(401).json({ message: 'Invalid Google Token' });
  }
};

module.exports = { signup, login, googleLogin };