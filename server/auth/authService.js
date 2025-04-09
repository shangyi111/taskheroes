// authService.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user'); 

// Signup service
const signup = async (email, username, password) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword, username });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return { user, token };
  } catch (error) {
    const errorMsg = error.errors?.[0]?.message;
    throw new Error(errorMsg || 'Failed to register user');
  }
};

// Login service
const login = async (email, password) => {
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('User not found');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return { user, token };
  } catch (error) {
    throw new Error(error.message || 'Failed to login');
  }
};

module.exports = { signup, login };