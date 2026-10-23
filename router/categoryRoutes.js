import { Router } from "express";
import { listCategories, createCategory, deleteCategory } from "../controllers/categoryController.js";
import { verifyJWT, authorizeRoles } from "../middlewares/authTypeMiddleware.js";

const router = Router();
router.get("/", listCategories); // landing page filter + admin dropdown
router.post("/", verifyJWT, authorizeRoles("Admin"), createCategory);
router.delete("/:id", verifyJWT, authorizeRoles("Admin"), deleteCategory);

export default router;
