import express from "express";
import { body, validationResult } from "express-validator";
import { mysqlPool } from "../configs/connectDB.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// GET all appointments for logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;  // ✅ Fixed: Use req.userId from authMiddleware
    const connection = await mysqlPool.getConnection();

    const [appointments] = await connection.query(
      'SELECT * FROM appointments WHERE user_id = ? ORDER BY appointment_date DESC',
      [userId]
    );

    connection.release();

    res.status(200).json({ 
      message: "Appointments fetched successfully",
      appointments 
    });
  } catch (error) {
    console.error('Fetch appointments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET appointment by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;  // ✅ Fixed: Use req.userId from authMiddleware
    
    const connection = await mysqlPool.getConnection();
    const [appointments] = await connection.query(
      'SELECT * FROM appointments WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    connection.release();

    if (appointments.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.status(200).json({ 
      message: "Appointment fetched successfully",
      appointment: appointments[0] 
    });
  } catch (error) {
    console.error('Fetch appointment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// CREATE appointment
router.post("/", authMiddleware, [
  body('appointment_date').isISO8601().withMessage('Valid date is required'),
  body('appointment_time').matches(/^\d{2}:\d{2}$/).withMessage('Valid time (HH:MM) is required'),
  body('appointment_type').notEmpty().withMessage('Appointment type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.userId;  // ✅ Fixed: Use req.userId from authMiddleware
    const { appointment_date, appointment_time, appointment_type, dentist_name, notes } = req.body;

    const connection = await mysqlPool.getConnection();

    const [result] = await connection.query(
      'INSERT INTO appointments (user_id, appointment_date, appointment_time, appointment_type, dentist_name, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, appointment_date, appointment_time, appointment_type, dentist_name || null, notes || null]
    );

    connection.release();

    res.status(201).json({
      message: 'Appointment created successfully',
      appointmentId: result.insertId
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// UPDATE appointment
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;  // ✅ Fixed: Use req.userId from authMiddleware
    const { appointment_date, appointment_time, appointment_type, dentist_name, notes, status } = req.body;

    const connection = await mysqlPool.getConnection();

    // Check if appointment exists and belongs to user
    const [appointments] = await connection.query(
      'SELECT * FROM appointments WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (appointments.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Update appointment
    await connection.query(
      'UPDATE appointments SET appointment_date = ?, appointment_time = ?, appointment_type = ?, dentist_name = ?, notes = ?, status = ? WHERE id = ?',
      [appointment_date, appointment_time, appointment_type, dentist_name || null, notes || null, status || 'pending', id]
    );

    connection.release();

    res.status(200).json({ message: 'Appointment updated successfully' });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE appointment
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;  // ✅ Fixed: Use req.userId from authMiddleware

    const connection = await mysqlPool.getConnection();

    // Check if appointment exists and belongs to user
    const [appointments] = await connection.query(
      'SELECT * FROM appointments WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (appointments.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Delete appointment
    await connection.query('DELETE FROM appointments WHERE id = ?', [id]);

    connection.release();

    res.status(200).json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
