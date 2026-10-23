import { Router } from "express";
import { uploadImage } from "../controllers/uploadController.js";
import upload from "../config/multerConfig.js";
import { verifyJWT, authorizeRoles } from "../middlewares/authTypeMiddleware.js";
import { apiResponse } from "../utils/apiResponse.js";

const routes = Router();

routes.post(
  "/uploadImage",
  verifyJWT,
  authorizeRoles("Admin"),
  (req, res, next) =>
    upload.single("file")(req, res, (err) =>
      err ? res.status(400).json(new apiResponse(400, null, err.message)) : next(),
    ),
  uploadImage,
);

export default routes;
