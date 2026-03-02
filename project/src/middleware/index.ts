import { Request, Response, NextFunction } from "express";
import express from "express";
import cors from "cors";

export const jsonParser = express.json();

// Level 1: Exercise 3
export const corsMiddlware = cors({
	origin: process.env.CORS_ORIGIN,
	credentials: true,
});

// Level 1: Exercise 3
export const requestLogger = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const timestamp = new Date().toISOString();
	console.log(`[${timestamp}] ${req.method} ${req.path}`);
	next();
};

// Level 1: Exercise 3
export const errorHandler = (
	err: Error,
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	console.error("error:", err);
	res.status(500).json({
		error: "internal server error",
		message: process.env.NODE_ENV === "development" ? err.message : undefined,
	});
};
