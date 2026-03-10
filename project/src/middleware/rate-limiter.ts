import rateLimit from "express-rate-limit";

if (!process.env.RATE_LIMIT_WINDOW_MS) {
    throw new Error('RATE_LIMIT_WINDOW_MS is undefined')
}
if (!process.env.RATE_LIMIT_MAX_REQUESTS) {
    throw new Error('RATE_LIMIT_MAX_REQUESTS is undefined')
}

// Rate limiter config
export const apiLimiter = rateLimit({
	windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS), // 15 minutes
	max: Number(process.env.RATE_LIMIT_MAX_REQUESTS), // max requests per IP
	message: {
		success: false,
		error: "Too many requests, please try again later.",
	},
	standardHeaders: true,
	legacyHeaders: false,
});

export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 5, // max requests per IP
	message: {
		success: false,
		error: "Too many login attempts, please try again later",
	},
	skipSuccessfulRequests: true,
});
