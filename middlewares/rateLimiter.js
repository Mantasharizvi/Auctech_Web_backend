import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  message: { success: false, message: "Too many attempts. Please try again later." },
});

// Landing-page contact form: stops spam without blocking real visitors
export const queryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  message: { success: false, message: "Too many queries. Please try again later." },
});
