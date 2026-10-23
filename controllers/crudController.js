import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";

// Shared list / create / update / delete used by websites, reels, posts and clients.
export const makeCrud = (Model, searchFields = ["name"]) => ({
  // Public: active items for the landing page
  listPublic: asyncHandler(async (req, res) => {
    const match = { isActive: true };
    if (req.query.category) match.category = String(req.query.category); // e.g. /websites?category=Software
    const data = await Model.find(match).sort({ order: 1, createdAt: -1 });
    res.status(200).json(new apiResponse(200, data, "Fetched successfully"));
  }),

  // Admin: pagination + search
  listAdmin: asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    const match = {};
    if (search) {
      const rx = new RegExp(search.trim(), "i");
      match.$or = searchFields.map((f) => ({ [f]: rx }));
    }
    const [data, total] = await Promise.all([
      Model.find(match).sort({ order: 1, createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      Model.countDocuments(match),
    ]);
    res.status(200).json(new apiResponse(200, { data, total }, "Fetched successfully"));
  }),

  create: asyncHandler(async (req, res) => {
    try {
      const doc = await Model.create(req.body);
      res.status(201).json(new apiResponse(201, doc, "Created successfully"));
    } catch (e) {
      res.status(400).json(new apiResponse(400, null, e.message));
    }
  }),

  update: asyncHandler(async (req, res) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doc) return res.status(404).json(new apiResponse(404, null, "Not found"));
    res.status(200).json(new apiResponse(200, doc, "Updated successfully"));
  }),

  remove: asyncHandler(async (req, res) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json(new apiResponse(404, null, "Not found"));
    res.status(200).json(new apiResponse(200, null, "Deleted successfully"));
  }),
});
