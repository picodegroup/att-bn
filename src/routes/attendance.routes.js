import { Router } from "express";
import {
  getAttendances,
  createAttendance,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
  getUserAttendanceStats,
  createCohortAttendance,
  getAttendancesByCohort,
  getCohortAttendanceSummary,
} from "../controller/attendance.controller.js";

import { protect, admin } from "../middleware/auth.middleware.js"; 

const router = Router();

router.route("/").get(protect, getAttendances).post(protect, createAttendance);
router
  .route("/:id")
  .get(protect, getAttendanceById)
  .put(protect, updateAttendance)
  .delete(protect, admin, deleteAttendance);

router.route("/stats/:userId").get(protect, getUserAttendanceStats);

router.route("/cohort").post(protect, admin, createCohortAttendance);

router.route("/cohort/:cohortId").get(protect, getAttendancesByCohort);

router
  .route("/cohort/:cohortId/summary")
  .get(protect, getCohortAttendanceSummary);

export default router;
