const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

const USER_TABLE_NAME = Users;

// Login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log("inside authService");
    const client = await pool.connect();
    const result = await client.query(`SELECT * FROM ${USER_TABLE_NAME} WHERE email = $1`, [email]);
    client.release();
    console.log("testing",result);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    console.log("testing user found before comparing password");
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1h', // Token expiration time
    });

    res.json({ token });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Signup endpoint
router.post('/signup', async (req, res) => {
  const { email, username, password } = req.body;
  try {
    const client = await pool.connect();
    // Check if user already exists
    const existingUser = await client.query(`SELECT * FROM ${USER_TABLE_NAME} WHERE email = $1 OR username = $2`, [email, username]);
    if (existingUser.rows.length > 0) {
      client.release();
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Hash password with 10 salt rounds
    const newUser = await client.query(
      `INSERT INTO ${USER_TABLE_NAME} (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email`,
      [username, email, hashedPassword]
    );
    client.release();
    res.status(201).json({ message: 'User registered successfully', user: newUser.rows[0] });
  } catch (errs) {
    const error = errs[0];
    console.error('Testing error during registration:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;