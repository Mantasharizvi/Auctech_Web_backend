export const apiError = (res, statusCode, status, message) =>
  res.status(statusCode).json({ status, message });
