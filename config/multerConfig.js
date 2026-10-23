import multer from "multer";

const allowed = [
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml",
  "video/mp4", "video/webm", "video/quicktime",
];

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) =>
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Only JPG, PNG, WEBP, GIF, SVG, MP4, WEBM and MOV files are allowed"), false),
  limits: { fileSize: 100 * 1024 * 1024 },
});

export default upload;
