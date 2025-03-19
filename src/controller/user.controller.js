import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/user.js";
import Attendance from "../models/attendance.js";

const generateToken = (data) => {
  return jwt.sign({ data }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

export const authUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const isPasswordCorrect = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(404).send({ message: "Invalid credentials!" });
    }

    const UserToken = {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      expired: user.expired,
    };

    const token = generateToken(UserToken);

    res
      .cookie("access_token", token, {
        httpOnly: true,
      })
      .status(200)
      .json({ user: user, token: token });
  } catch (error) {
    next(error);
  }
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, telephone, password = "password123" } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    // Create user with simplified fields as requested
    const user = await User.create({
      name,
      email,
      telephone, // Add telephone field
      password, // Default password that can be changed later
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        telephone: user.telephone,
        role: user.role,
        isStudent: user.isStudent,
        paymentStatus: user.paymentStatus,
        createdAt: user.createdAt,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.deleteOne({ _id: req.params.id });
    res.json({ message: "User removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (user) {
      const absences = await Attendance.countDocuments({
        user: user._id,
        status: "absent",
      });

      const lateArrivals = await Attendance.countDocuments({
        user: user._id,
        status: "late",
      });
      const recentAttendance = await Attendance.find({
        user: user._id,
      })
        .sort({ date: -1 })
        .limit(10);

      res.json({
        user,
        attendanceStats: {
          totalAbsent: absences,
          totalLate: lateArrivals,
        },
        recentAttendance,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    const user = await User.findById(req.params.id);

    if (user) {
      user.paymentStatus = paymentStatus || user.paymentStatus;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isStudent: updatedUser.isStudent,
        paymentStatus: updatedUser.paymentStatus,
        attendanceStats: updatedUser.attendanceStats,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const searchStudents = async (req, res) => {
  try {
    const searchQuery = req.query.search;

    if (!searchQuery) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const students = await User.find({
      isStudent: true,
      name: { $regex: searchQuery, $options: "i" },
    })
      .select("-password")
      .sort({ name: 1 });

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
