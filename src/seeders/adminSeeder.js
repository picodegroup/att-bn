import User from "../models/user.js";
import { BcryptUtil } from "../utils/bcrypt.js";
import { generateToken } from "../utils/Tokens.js";

export const adminSeeder = async () => {
  try {
    const adminUser = await User.findOne({ email: "admin@picodegroup.com" });
    if (adminUser) {
      console.log("Admin user is connected!");
      return;
    }

    const adminUserData = {
      name: "Super Admin",
      email: "admin@picodegroup.com",
      password: process.env.ADMIN_PWD,
      role: "admin",
      isStudent: false,
      paymentStatus: "not_applicable",
    };
    const hashedPassword = await BcryptUtil.hash(process.env.ADMIN_PWD);

    adminUserData.password = process.env.ADMIN_PWD;

    const createdAdminUser = await User.create(adminUserData);

    const token = generateToken(createdAdminUser);

    console.log("Admin user seeded successfully");
    console.log("Admin user token:", token);
  } catch (error) {
    console.error("Error seeding admin user:", error);
  }
};
