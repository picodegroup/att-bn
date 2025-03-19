import {
  registerUser,
  authUser,
  getUsers,
  deleteUser,
  getUserById,
  updatePaymentStatus,
  searchStudents,
} from "../controller/user.controller.js";
import { protect, admin } from "../middleware/auth.middleware.js";
import { Router } from "express";

const router = Router();

router
  .route("/")
  .post(protect, admin, registerUser)
  .get(protect, admin, getUsers);

router.route("/login").post(authUser);
router.route("/students").get(protect, searchStudents);

router
  .route("/:id")
  .delete(protect, admin, deleteUser)
  .get(protect, getUserById);
router.route("/:id/payment-status").put(protect, admin, updatePaymentStatus);

export default router;