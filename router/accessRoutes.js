import { Router } from "express";
import {
  submitSignup, submitLogin, getStatus, decisionByLink, listRequests, decideRequest,
} from "../controllers/accessController.js";
import { verifyJWT, authorizeRoles } from "../middlewares/authTypeMiddleware.js";
import { authLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

// Public (landing page)
router.post("/signup", authLimiter, submitSignup);
router.post("/login", authLimiter, submitLogin);
router.get("/status/:id", getStatus);
router.get("/decision", decisionByLink); // approve / reject link from email

// Admin panel
router.get("/", verifyJWT, authorizeRoles("Admin"), listRequests);
router.post("/:id/decision", verifyJWT, authorizeRoles("Admin"), decideRequest);

export default router;
