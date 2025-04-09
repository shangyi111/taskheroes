const authService = require('./authService'); // Assuming you create this file

// Signup controller
const signup = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const { user, token } = await authService.signup(email, username, password);
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

module.exports = { signup, login };