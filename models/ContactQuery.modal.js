import mongoose from "mongoose";

const ContactQuerySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    business: { type: String, required: true, trim: true },
    industry: { type: String, trim: true },
    service: { type: String, trim: true },
    hosting: { type: String, trim: true },
    currentWebsite: { type: String, trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ["new", "contacted", "closed"], default: "new" },
    source: { type: String, default: "landing-page" },
    ip: String,
  },
  { timestamps: true },
);

export default mongoose.model("ContactQuery", ContactQuerySchema);
