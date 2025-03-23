import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    schoolName: {
      type: String,
      required: true,
    },
    combination: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    telephone: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["admin", "user", "student"],
      default: "user",
    },
    isStudent: {
      type: Boolean,
      default: true,
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "pending", "not_applicable"],
      default: "pending",
    },
    attendanceStats: {
      totalAbsent: {
        type: Number,
        default: 0,
      },
      totalLate: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

export default mongoose.model("User", userSchema);
