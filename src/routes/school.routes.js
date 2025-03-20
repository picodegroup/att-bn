import { Router } from "express";
import { 
  createSchool, 
  getSchools, 
  getSchoolById, 
  updateSchool, 
  deleteSchool 
} from "../controller/school.controller.js";
import { protect, admin } from "../middleware/auth.middleware.js";

const router = Router();

router
  .route("/")
  .post(protect, admin, createSchool)
  .get(protect, getSchools);

router
  .route("/:id")
  .get(protect, getSchoolById)
  .put(protect, admin, updateSchool)
  .delete(protect, admin, deleteSchool);

export default router;