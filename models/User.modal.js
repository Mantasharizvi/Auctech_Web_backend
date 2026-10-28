import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    company: { type: String, trim: true },
    role: { type: String, enum: ["Admin"], default: "Admin" }, // admin panel users only
    // forgot-password OTP (stored hashed, never returned by the API)
    resetOtpHash: { type: String, select: false },
    resetOtpExpires: { type: Date, select: false },
    resetOtpAttempts: { type: Number, default: 0, select: false },
    resetOtpSentAt: { type: Date, select: false },
  },
  { timestamps: true },
);

UserSchema.methods.matchPassword = function (password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.methods.generateAuthToken = function (expiresIn = "7d") {
  return jwt.sign({ userId: this._id, role: this.role }, process.env.JWT_SECRET, { expiresIn });
};

export default mongoose.model("User", UserSchema);
