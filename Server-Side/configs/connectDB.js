import mongoose from "mongoose";
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () =>{
    try{
        await mongoose.connect(process.env.DB_URI);
        console.log("DataBase Connected Successfully");
    }catch(err){
        console.error("DataBasr Connection Failed", err.message);
        process.exit(1);
    }
};

export const mysqlPool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default connectDB;
