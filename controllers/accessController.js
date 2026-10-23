import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.modal.js";
import bcrypt from "bcryptjs";
import AccessRequest from "../models/AccessRequest.modal.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { sendEmail } from "../utils/sendEmail.js";

const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const baseUrl = () => (process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, "");
const decisionLink = (id, action) =>
  `${baseUrl()}/api/access/decision?t=${jwt.sign({ id, action, purpose: "decision" }, process.env.JWT_SECRET, { expiresIn: "3d" })}`;

// Mail to admin: who wants access + one-click approve / reject.
// The password is never put in an email.
const notifyAdmin = async (reqDoc) => {
  const rows = [["Type", reqDoc.type === "signup" ? "Sign up" : "Login"], ["Name", reqDoc.name], ["Email", reqDoc.email], ["Company", reqDoc.company], ["Time", new Date().toLocaleString("en-IN")]]
    .map(([k, v]) => `<tr><td style="padding:6px 14px 6px 0"><b>${k}</b></td><td>${esc(v)}</td></tr>`).join("");
   sendEmail(
    process.env.ADMIN_NOTIFY_EMAIL,
    `New ${reqDoc.type} request: ${reqDoc.name} (${reqDoc.company})`,
    `<h3>New ${reqDoc.type} request</h3><table>${rows}</table><p>
      <a href="${decisionLink(reqDoc._id, "approve")}" style="background:#16a34a;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Approve</a>&nbsp;
      <a href="${decisionLink(reqDoc._id, "reject")}" style="background:#dc2626;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Reject</a></p>
      <p>You can also manage requests in the admin panel.</p>`,
  ).catch((e) => console.error("Admin mail failed:", e.message));
};

const createRequest = (type, user, req) =>
  AccessRequest.create({
    type, user: user._id, name: user.name, email: user.email, company: user.company,
    statusKey: crypto.randomBytes(16).toString("hex"), ip: req.ip,
  });

const sent = (res, r, message) =>
  res.status(201).json(new apiResponse(201, { requestId: r._id, statusKey: r.statusKey, status: r.status }, message));

// SIGN UP: name, email, password, company
const submitSignup = asyncHandler(async (req, res) => {
  const { name, email, password, company } = req.body;
  if (!name?.trim() || !email?.trim() || !password || !company?.trim())
    return res.status(400).json(new apiResponse(400, null, "Name, email, password and company name are required"));
  if (password.length < 6)
    return res.status(400).json(new apiResponse(400, null, "Password must be at least 6 characters"));
  if (await User.findOne({ email: email.trim().toLowerCase() }))
    return res.status(409).json(new apiResponse(409, null, "This email is already registered. Please log in."));

  const user = await User.create({
    name, email, company, password: await bcrypt.hash(password, 10), status: "pending",
  });
  const r = await createRequest("signup", user, req);
  notifyAdmin(r); // not awaited: email must not delay the response
  return sent(res, r, "Sign up request sent. Please wait for admin confirmation.");
});

// LOGIN: email, password, company  (each login needs admin confirmation)
const submitLogin = asyncHandler(async (req, res) => {
  const { email, password, company } = req.body;
  if (!email?.trim() || !password || !company?.trim())
    return res.status(400).json(new apiResponse(400, null, "Email, password and company name are required"));

  const user = await User.findOne({ email: email.trim().toLowerCase(), role: "Visitor" });
  if (!user || !(await user.matchPassword(password)) || user.company?.toLowerCase() !== company.trim().toLowerCase())
    return res.status(401).json(new apiResponse(401, null, "Invalid email, password or company name"));
  if (user.status === "rejected")
    return res.status(403).json(new apiResponse(403, null, "Your access request was rejected."));

  const r = await createRequest("login", user, req);
  notifyAdmin(r); // not awaited: email must not delay the response
  return sent(res, r, "Login request sent. Please wait for admin confirmation.");
});

// Landing page polls this until the admin decides. Token is issued once on approval.
const getStatus = asyncHandler(async (req, res) => {
  const r = await AccessRequest.findById(req.params.id);
  if (!r || r.statusKey !== req.query.key)
    return res.status(404).json(new apiResponse(404, null, "Request not found"));

  let token;
  if (r.status === "approved" && !r.consumed) {
    const user = await User.findById(r.user);
    token = user.generateAuthToken("7d");
    r.consumed = true;
    await r.save();
  }
  return res.status(200).json(new apiResponse(200, { status: r.status, token, name: r.name }, "Status fetched"));
});

const applyDecision = async (r, action) => {
  r.status = action === "approve" ? "approved" : "rejected";
  r.decidedAt = new Date();
  await r.save();
  const user = await User.findById(r.user);
  if (action === "approve") user.status = "approved";
  else if (r.type === "signup") user.status = "rejected";
  await user.save();
  sendEmail( // not awaited: approval must not wait for the email
    user.email,
    action === "approve" ? "Your AUCTECH MARCOM access is approved" : "Your AUCTECH MARCOM request",
    action === "approve"
      ? `<p>Hello ${esc(user.name)},</p><p>Your ${r.type} request is approved. Please return to the website tab, it will open automatically.</p>`
      : `<p>Hello ${esc(user.name)},</p><p>Sorry, your ${r.type} request was not approved.</p>`,
  ).catch((e) => console.error("User mail failed:", e.message));
};

// One-click link from the admin's email
const decisionByLink = asyncHandler(async (req, res) => {
  let p;
  try { p = jwt.verify(req.query.t, process.env.JWT_SECRET); } catch { return res.status(400).send("Link expired or invalid."); }
  if (p.purpose !== "decision") return res.status(400).send("Invalid link.");
  const r = await AccessRequest.findById(p.id);
  if (!r) return res.status(404).send("Request not found.");
  if (r.status === "pending") await applyDecision(r, p.action);
  res.send(`<body style="font-family:sans-serif;text-align:center;padding:60px"><h2>Request ${esc(r.status)}</h2><p>${esc(r.name)} (${esc(r.email)})</p></body>`);
});

// Admin panel
const listRequests = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, type, search } = req.query;
  const match = {};
  if (status) match.status = status;
  if (type) match.type = type;
  if (search) { const rx = new RegExp(search.trim(), "i"); match.$or = [{ name: rx }, { email: rx }, { company: rx }]; }
  const [data, total] = await Promise.all([
    AccessRequest.find(match).select("-statusKey").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
    AccessRequest.countDocuments(match),
  ]);
  return res.status(200).json(new apiResponse(200, { data, total }, "Requests fetched"));
});

const decideRequest = asyncHandler(async (req, res) => {
  const { action } = req.body;
  if (!["approve", "reject"].includes(action))
    return res.status(400).json(new apiResponse(400, null, "Action must be approve or reject"));
  const r = await AccessRequest.findById(req.params.id);
  if (!r) return res.status(404).json(new apiResponse(404, null, "Request not found"));
  await applyDecision(r, action);
  return res.status(200).json(new apiResponse(200, r, `Request ${r.status}`));
});

export { submitSignup, submitLogin, getStatus, decisionByLink, listRequests, decideRequest };