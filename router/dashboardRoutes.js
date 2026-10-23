import { Router } from "express";
import { getDashboard } from "../controllers/dashboardController.js";
import { verifyJWT, authorizeRoles } from "../middlewares/authTypeMiddleware.js";

const router = Router();
router.get("/", verifyJWT, authorizeRoles("Admin"), getDashboard);

export default router;
