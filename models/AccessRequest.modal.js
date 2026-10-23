import mongoose from "mongoose";

const AccessRequestSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["login", "signup"], required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: String,
    email: { type: String, lowercase: true },
    company: String,
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    statusKey: { type: String, required: true },
    consumed: { type: Boolean, default: false },
    decidedAt: Date,
    ip: String,
  },
  { timestamps: true },
);

export default mongoose.model("AccessRequest", AccessRequestSchema);
