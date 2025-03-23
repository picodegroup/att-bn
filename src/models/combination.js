import mongoose from "mongoose";

const combinationSchool = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

const Combination = mongoose.model("Combination", combinationSchool);

export default Combination;