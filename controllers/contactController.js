import ContactQuery from "../models/ContactQuery.modal.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";

const clean = (v, max = 1000) => String(v ?? "").trim().slice(0, max);
const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// PUBLIC (landing page): save a contact query
const submitQuery = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const data = {
    name: clean(b.name, 120),
    phone: clean(b.phone, 30),
    email: clean(b.email, 160),
    business: clean(b.business, 160),
    industry: clean(b.industry, 120),
    service: clean(b.service ?? b.plan, 120),
    hosting: clean(b.hosting, 120),
    currentWebsite: clean(b.currentWebsite, 120),
    message: clean(b.message, 3000),
  };
  if (!data.name || !data.phone || !data.email || !data.business || !data.message)
    return res.status(400).json(new apiResponse(400, null, "Name, phone, email, business and message are required"));
  if (!/^\S+@\S+\.\S+$/.test(data.email))
    return res.status(400).json(new apiResponse(400, null, "Please enter a valid email"));

  const doc = await ContactQuery.create({ ...data, ip: req.ip });
  return res.status(201).json(new apiResponse(201, { id: doc._id }, "Your query has been received"));
});

// ADMIN: list with filters + pagination
const listQueries = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;
  const match = {};
  if (status) match.status = status;
  if (search?.trim()) {
    const rx = new RegExp(escapeRx(search.trim()), "i");
    match.$or = [{ name: rx }, { email: rx }, { phone: rx }, { business: rx }, { message: rx }];
  }
  const [data, total] = await Promise.all([
    ContactQuery.find(match).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
    ContactQuery.countDocuments(match),
  ]);
  return res.status(200).json(new apiResponse(200, { data, total }, "Queries fetched"));
});

// ADMIN: change status (new / contacted / closed)
const updateQueryStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["new", "contacted", "closed"].includes(status))
    return res.status(400).json(new apiResponse(400, null, "Status must be new, contacted or closed"));
  const doc = await ContactQuery.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!doc) return res.status(404).json(new apiResponse(404, null, "Query not found"));
  return res.status(200).json(new apiResponse(200, doc, "Status updated"));
});

// ADMIN: delete
const deleteQuery = asyncHandler(async (req, res) => {
  const doc = await ContactQuery.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json(new apiResponse(404, null, "Query not found"));
  return res.status(200).json(new apiResponse(200, null, "Query deleted"));
});

export { submitQuery, listQueries, updateQueryStatus, deleteQuery };
