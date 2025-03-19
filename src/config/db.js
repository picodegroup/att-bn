import mongoose from "mongoose";
import { adminSeeder } from "../seeders/adminSeeder.js";
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    adminSeeder();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};
