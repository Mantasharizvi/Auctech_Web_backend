import mongoose from "mongoose";

// A login request from the landing page (name, email, company). No user account / password.
const AccessRequestSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    email: { type: String, lowercase: true, trim: true, required: true },
    company: { type: String, trim: true, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    statusKey: { type: String, required: true },
    consumed: { type: Boolean, default: false },
    decidedAt: Date,
    ip: String,
  },
  { timestamps: true },
);

export default mongoose.model("AccessRequest", AccessRequestSchema);
