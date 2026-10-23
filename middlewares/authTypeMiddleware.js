import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apiError.js";
import User from "../models/User.modal.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return apiError(res, 401, false, "Unauthorized request: No token provided");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded?.userId).select("-password");
    if (!user) return apiError(res, 401, false, "Invalid access token: User not found");

    req.user = user;
    next();
  } catch (error) {
    return apiError(res, 401, false, "Authentication failed. Please log in again.");
  }
});

export const authorizeRoles = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role)
    ? next()
    : apiError(res, 403, false, "Forbidden: You do not have access to this resource");
