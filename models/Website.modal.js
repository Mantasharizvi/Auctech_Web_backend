import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    domain: { type: String, trim: true },
    category: { type: String, trim: true },
    url: { type: String, required: true, trim: true },
    logo: { type: String },
    logoBg: { type: String, enum: ["dark", "white"], default: "white" },
    description: { type: String, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("Website", schema);
