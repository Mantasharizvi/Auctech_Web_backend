import { Readable } from "stream";
import cloudinary from "../config/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";

// Images and videos (reels) both go to Cloudinary; the URL is returned as imageUrl
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file)
    return res.status(400).json(new apiResponse(400, null, "No file uploaded. Please select a file"));

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET)
    return res.status(500).json(new apiResponse(500, null, "Cloudinary is not configured. Add CLOUDINARY_* values in backend/.env and restart the server."));

  const stream = cloudinary.uploader.upload_stream({ resource_type: "auto" }, (error, result) => {
    if (error) console.error("Cloudinary upload error:", error.message);
    if (error) return res.status(500).json(new apiResponse(500, null, `Upload failed: ${error.message}`));
    return res.status(200).json(new apiResponse(200, { imageUrl: result.secure_url }, "Uploaded successfully"));
  });
  Readable.from(req.file.buffer).pipe(stream);
});

export { uploadImage };