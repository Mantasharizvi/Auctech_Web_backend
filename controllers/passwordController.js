import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.modal.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { sendEmail } from "../utils/sendEmail.js";

// Forgot password for BOTH the landing page (role "Visitor") and the admin panel (role "Admin").
const OTP_MINUTES = 10;
const RESEND_SECONDS = 30;
const MAX_ATTEMPTS = 5;

const roleOf = (r) => (r === "Admin" ? "Admin" : "Visitor");
const emailOf = (e) => String(e || "").trim().toLowerCase();
const hashOtp = (email, otp) =>
  crypto.createHash("sha256").update(`${email}:${otp}:${process.env.JWT_SECRET}`).digest("hex");
const withTimeout = (p, ms) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("Email timed out")), ms))]);

// 1) email -> "not registered" or send OTP
const forgotPassword = asyncHandler(async (req, res) => {
  const email = emailOf(req.body.email);
  if (!/^\S+@\S+\.\S+$/.test(email))
    return res.status(400).json(new apiResponse(400, null, "Please enter a valid email"));

  const user = await User.findOne({ email, role: roleOf(req.body.role) }).select("+resetOtpSentAt");
  if (!user) return res.status(404).json(new apiResponse(404, null, "Email is not registered"));

  const wait = user.resetOtpSentAt ? RESEND_SECONDS - Math.floor((Date.now() - user.resetOtpSentAt) / 1000) : 0;
  if (wait > 0)
    return res.status(429).json(new apiResponse(429, { retryAfter: wait }, `Please wait ${wait}s before requesting a new OTP`));

  const otp = String(crypto.randomInt(100000, 1000000));
  user.resetOtpHash = hashOtp(email, otp);
  user.resetOtpExpires = new Date(Date.now() + OTP_MINUTES * 60 * 1000);
  user.resetOtpAttempts = 0;
  user.resetOtpSentAt = new Date();
  await user.save();

  if (process.env.NODE_ENV !== "production") console.log(`🔐 OTP for ${email}: ${otp}`); // local testing only

  try {
    await withTimeout(
      sendEmail(
        email,
        "Your AUCTECH MARCOM password reset OTP",
        `<p>Hello ${user.name || ""},</p><p>Your OTP to reset your password is:</p>
         <h2 style="letter-spacing:6px">${otp}</h2>
         <p>It is valid for ${OTP_MINUTES} minutes. If you did not ask for this, you can ignore this email.</p>`,
      ),
      15000,
    );
  } catch (e) {
    console.error("OTP mail failed:", e.message);
    return res.status(500).json(new apiResponse(500, null, "Could not send the OTP email. Please try again."));
  }
  return res.status(200).json(new apiResponse(200, { resendIn: RESEND_SECONDS }, "OTP sent to your email"));
});

// 2) email + otp -> short-lived reset token
const verifyOtp = asyncHandler(async (req, res) => {
  const email = emailOf(req.body.email);
  const otp = String(req.body.otp || "").trim();
  const user = await User.findOne({ email, role: roleOf(req.body.role) })
    .select("+resetOtpHash +resetOtpExpires +resetOtpAttempts +password");
  if (!user || !user.resetOtpHash)
    return res.status(400).json(new apiResponse(400, null, "Please request a new OTP"));
  if (user.resetOtpExpires < new Date())
    return res.status(400).json(new apiResponse(400, null, "OTP expired. Please resend OTP"));
  if (user.resetOtpAttempts >= MAX_ATTEMPTS)
    return res.status(429).json(new apiResponse(429, null, "Too many wrong attempts. Please resend OTP"));

  if (hashOtp(email, otp) !== user.resetOtpHash) {
    user.resetOtpAttempts += 1;
    await user.save();
    return res.status(400).json(new apiResponse(400, null, "Incorrect OTP"));
  }

  user.resetOtpHash = undefined;
  user.resetOtpExpires = undefined;
  user.resetOtpAttempts = 0;
  await user.save();

  // pwd marker makes the token useless once the password has been changed
  const resetToken = jwt.sign(
    { id: user._id, purpose: "reset", pwd: user.password.slice(-10) },
    process.env.JWT_SECRET,
    { expiresIn: "10m" },
  );
  return res.status(200).json(new apiResponse(200, { resetToken }, "OTP verified"));
});

// 3) reset token + new password
const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword, confirmPassword } = req.body;
  if (!newPassword || newPassword.length < 6)
    return res.status(400).json(new apiResponse(400, null, "Password must be at least 6 characters"));
  if (newPassword !== confirmPassword)
    return res.status(400).json(new apiResponse(400, null, "Passwords do not match"));

  let p;
  try { p = jwt.verify(resetToken, process.env.JWT_SECRET); }
  catch { return res.status(400).json(new apiResponse(400, null, "Session expired. Please start again")); }
  if (p.purpose !== "reset") return res.status(400).json(new apiResponse(400, null, "Invalid request"));

  const user = await User.findById(p.id);
  if (!user || user.password.slice(-10) !== p.pwd)
    return res.status(400).json(new apiResponse(400, null, "Session expired. Please start again"));

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  return res.status(200).json(new apiResponse(200, null, "Password changed successfully"));
});

export { forgotPassword, verifyOtp, resetPassword };
