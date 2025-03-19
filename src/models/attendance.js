import mongoose from "mongoose";

const attendanceSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    cohort: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Cohort",
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      required: true,
    },
    note: {
      type: String,
    },
    lateArrivalTime: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Attendance", attendanceSchema);
