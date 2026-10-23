import User from "../models/User.modal.js";
import AccessRequest from "../models/AccessRequest.modal.js";
import Website from "../models/Website.modal.js";
import Reel from "../models/Reel.modal.js";
import Post from "../models/Post.modal.js";
import ContactQuery from "../models/ContactQuery.modal.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";

const getDashboard = asyncHandler(async (req, res) => {
  const [pending, approvedUsers, websites, reels, posts, queries] = await Promise.all([
    AccessRequest.countDocuments({ status: "pending" }),
    User.countDocuments({ role: "Visitor", status: "approved" }),
    Website.countDocuments(), Reel.countDocuments(), Post.countDocuments(),
    ContactQuery.countDocuments({ status: "new" }),
  ]);
  res.status(200).json(new apiResponse(200, { pending, approvedUsers, websites, reels, posts, queries }, "Dashboard fetched"));
});

export { getDashboard };
