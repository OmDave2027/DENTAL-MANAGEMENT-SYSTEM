import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { mysqlPool } from "../configs/connectDB.js";

const router = express.Router();

// SIGN UP
router.post("/signup", [
  body().custom((value) => {
    if (!(value.full_name || (value.Firstname && value.Lastname))) {
      throw new Error("First and last name are required");
    }
    return true;
  }),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      full_name,
      Firstname,
      Lastname,
      email,
      password,
      phone,
      date_of_birth,
      address,
      city,
      state,
      zip_code,
    } = req.body;
    const name = full_name || `${Firstname} ${Lastname}`.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const connection = await mysqlPool.getConnection();

    // Check if user already exists
    const [existingUser] = await connection.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existingUser.length > 0) {
      connection.release();
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    await connection.query(
      'INSERT INTO users (full_name, email, password_hash, phone, date_of_birth, address, city, state, zip_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, normalizedEmail, hashedPassword, phone || null, date_of_birth || null, address || null, city || null, state || null, zip_code || null]
    );

    connection.release();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// LOGIN
router.post("/login", [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const connection = await mysqlPool.getConnection();

    // Find user
    const [users] = await connection.query('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    connection.release();

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role || "PATIENT" },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        Firstname: user.full_name.split(" ")[0],
        Lastname: user.full_name.split(" ").slice(1).join(" "),
        email: user.email,
        phone: user.phone,
        role: user.role || "PATIENT"
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
