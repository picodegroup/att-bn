import { Router } from "express";
import {
  createCombination,
  getCombinations,
  getCombinationById,
  updateCombination,
  deleteCombination,
} from "../controller/combination.controller.js";
import { protect, admin } from "../middleware/auth.middleware.js";

const router = Router();

router
  .route("/")
  .post(protect, admin, createCombination)
  .get(protect, getCombinations);

router
  .route("/:id")
  .get(protect, getCombinationById)
  .put(protect, admin, updateCombination)
  .delete(protect, admin, deleteCombination);

export default router;
