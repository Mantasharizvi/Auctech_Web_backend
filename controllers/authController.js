import User from "../models/User.modal.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";

// Admin panel login (email + password)
const loginWithPassword = asyncHandler(async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const { password } = req.body;
  if (!email || !password)
    return res.status(400).json(new apiResponse(400, null, "Email and password are required"));

  const user = await User.findOne({ email, role: "Admin" });
  if (!user || !(await user.matchPassword(password)))
    return res.status(401).json(new apiResponse(401, null, "Invalid email or password"));

  return res.status(200).json(
    new apiResponse(200, { authToken: user.generateAuthToken("30d"), role: user.role }, "Login successful"),
  );
});

const getProfile = asyncHandler(async (req, res) =>
  res.status(200).json(new apiResponse(200, req.user, "Profile fetched")),
);

export { loginWithPassword, getProfile };
