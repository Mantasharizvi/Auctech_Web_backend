import WebsiteCategory from "../models/WebsiteCategory.modal.js";
import Website from "../models/Website.modal.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";

const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Public + admin: all categories (only the ones the admin has added)
const listCategories = asyncHandler(async (req, res) => {
  const data = await WebsiteCategory.find().sort({ createdAt: 1 }).select("name");
  return res.status(200).json(new apiResponse(200, data, "Categories fetched"));
});

// Admin: add a new category
const createCategory = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim().replace(/\s+/g, " ").slice(0, 60);
  if (!name) return res.status(400).json(new apiResponse(400, null, "Category name is required"));
  const exists = await WebsiteCategory.findOne({ name: new RegExp(`^${escapeRx(name)}$`, "i") });
  if (exists) return res.status(409).json(new apiResponse(409, exists, "This category already exists"));
  const doc = await WebsiteCategory.create({ name });
  return res.status(201).json(new apiResponse(201, doc, "Category added"));
});

// Admin: delete a category (blocked while websites still use it)
const deleteCategory = asyncHandler(async (req, res) => {
  const doc = await WebsiteCategory.findById(req.params.id);
  if (!doc) return res.status(404).json(new apiResponse(404, null, "Category not found"));
  const used = await Website.countDocuments({ category: doc.name });
  if (used)
    return res.status(409).json(new apiResponse(409, null, `${used} website(s) use this category. Change them first.`));
  await doc.deleteOne();
  return res.status(200).json(new apiResponse(200, null, "Category deleted"));
});

export { listCategories, createCategory, deleteCategory };
