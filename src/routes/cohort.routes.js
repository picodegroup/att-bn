import {
  createCohort,
  getCohorts,
  updateCohort,
  addStudentsToCohort,
  removeStudentsFromCohort,
  getCohortById,
} from "../controller/cohort.controller.js";
import { protect, admin } from "../middleware/auth.middleware.js";
import { Router } from "express";

const router = Router();
router.route("/").post(protect, admin, createCohort).get(protect, getCohorts);

router
  .route("/:id")
  .get(protect, getCohortById)
  .put(protect, admin, updateCohort);

router
  .route("/:id/students")
  .post(protect, admin, addStudentsToCohort)
  .delete(protect, admin, removeStudentsFromCohort);

export default router;
