import { Router } from "express";
import { loginWithPassword, getProfile } from "../controllers/authController.js";
import { forgotPassword, verifyOtp, resetPassword } from "../controllers/passwordController.js";
import { verifyJWT } from "../middlewares/authTypeMiddleware.js";
import { authLimiter } from "../middlewares/rateLimiter.js";

const routes = Router();

routes.route("/loginWithPassword").post(authLimiter, loginWithPassword);
routes.route("/profile").get(verifyJWT, getProfile);

// Forgot password (admin panel only)
routes.route("/forgot-password").post(authLimiter, forgotPassword);
routes.route("/verify-otp").post(authLimiter, verifyOtp);
routes.route("/reset-password").post(authLimiter, resetPassword);

export default routes;
