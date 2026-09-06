import express from "express";
import { body, validationResult } from "express-validator";
import { mysqlPool } from "../configs/connectDB.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
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
  body().custom((value) => {
    if (!(value.appointment_date || value.date)) throw new Error("Valid date is required");
    if (!(value.appointment_time || value.time)) throw new Error("Valid time is required");
    if (!(value.appointment_type || value.service)) throw new Error("Appointment type is required");
    return true;
  }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.userId;  // ✅ Fixed: Use req.userId from authMiddleware
    const {
      appointment_date = req.body.date,
      appointment_time: rawTime = req.body.time,
      appointment_type = req.body.service,
      dentist_name,
      notes,
    } = req.body;
    if (!/^\d{2}:\d{2}$/.test(rawTime)) {
      const match = rawTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!match) return res.status(400).json({ message: "Valid time is required" });
      let hour = Number(match[1]);
      if (match[3].toUpperCase() === "PM" && hour !== 12) hour += 12;
      if (match[3].toUpperCase() === "AM" && hour === 12) hour = 0;
      req.body.appointment_time = `${String(hour).padStart(2, "0")}:${match[2]}`;
    } else {
      req.body.appointment_time = rawTime;
    }

    const connection = await mysqlPool.getConnection();

    const [result] = await connection.query(
      'INSERT INTO appointments (user_id, appointment_date, appointment_time, appointment_type, dentist_name, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, appointment_date, req.body.appointment_time, appointment_type, dentist_name || null, notes || null]
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
