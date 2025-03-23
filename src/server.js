import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

import { adminSeeder } from "./seeders/adminSeeder.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import usersRoutes from "./routes/users.routes.js";
import cohortRoutes from "./routes/cohort.routes.js";
import schoolRoutes from "./routes/school.routes.js";
import combinationRoutes from "./routes/combination.routes.js";
import "dotenv/config";

const port = process.env.PORT || 5000;
const app = express();

app.use(cors());

const connect = () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("connected to db"))
    .then(() => {
      adminSeeder();
      app.use(express.json());
    })
    .catch((err) => {
      throw err;
    });
};

app.use(express.json());

app.use("/api/attendance", attendanceRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/cohorts", cohortRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/combinations", combinationRoutes);

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

app.use(cors());

app.use("/files", express.static("files"));
app.use(cookieParser());

app.listen(port, () => {
  connect();
  console.log(`app is listening on ${port} `);
});
