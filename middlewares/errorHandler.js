export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(Number(err.status) >= 400 ? Number(err.status) : 500).json({
    success: false,
    message: err.message || "Server Error",
  });
};
