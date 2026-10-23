import { Router } from "express";
import { submitQuery, listQueries, updateQueryStatus, deleteQuery } from "../controllers/contactController.js";
import { verifyJWT, authorizeRoles } from "../middlewares/authTypeMiddleware.js";
import { queryLimiter } from "../middlewares/rateLimiter.js";

const router = Router();
const admin = [verifyJWT, authorizeRoles("Admin")];

// Public (landing page contact form)
router.post("/", queryLimiter, submitQuery);

// Admin panel
router.get("/", ...admin, listQueries);
router.put("/:id/status", ...admin, updateQueryStatus);
router.delete("/:id", ...admin, deleteQuery);

export default router;
