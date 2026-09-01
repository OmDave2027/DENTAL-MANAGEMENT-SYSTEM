import bcrypt from "bcrypt";
import { mysqlPool } from "../configs/connectDB.js";

const DEFAULT_ADMIN = {
  email: "admin@gmail.com",
  password: "password@123",
  full_name: "Admin User",
  role: "ADMIN",
};

export default async function createDefaultAdmin() {
  try {
    console.log("🔍 Checking for existing Admin...");

    const connection = await mysqlPool.getConnection();

    // Check if admin already exists
    const [existingAdmin] = await connection.query(
      'SELECT * FROM users WHERE email = ? AND role = ?',
      [DEFAULT_ADMIN.email, DEFAULT_ADMIN.role]
    );

    if (existingAdmin.length > 0) {
      console.log("✅ Admin already exists.");
      connection.release();
      return;
    }

    console.log("🚀 Creating Default Admin...");

    // Hash password
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, 10);

    // Create default admin
    await connection.query(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [DEFAULT_ADMIN.full_name, DEFAULT_ADMIN.email, passwordHash, DEFAULT_ADMIN.role]
    );

    connection.release();

    console.log("✅ Default Admin created successfully!");
    console.log(`   Email: ${DEFAULT_ADMIN.email}`);
    console.log(`   Password: ${DEFAULT_ADMIN.password}`);
  } catch (error) {
    console.error("❌ Failed to create Admin:", error.message);
  }
}
