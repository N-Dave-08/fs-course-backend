// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { ZodError, ZodIssue } from "zod";

/**
 * Base class for application-specific errors
 * Use this to throw errors in your routes/middleware instead of calling res.status().json()
 */
export class AppError extends Error {
	public readonly statusCode: number; // HTTP status code for the error
	public readonly isOperational: boolean; // Distinguish between expected vs programming errors

	constructor(message: string, statusCode: number = 500) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = true;

		// Captures the stack trace excluding this constructor
		Error.captureStackTrace(this, this.constructor);
	}
}

/**
 * 400 Bad Request error, e.g., failed business logic or manual validation
 */
export class ValidationError extends AppError {
	public readonly details?: Record<string, string>;
	constructor(message: string, details?: Record<string, string>) {
		super(message, 400);
		this.details = details;
	}
}

/**
 * 404 Not Found error
 */
export class NotFoundError extends AppError {
	constructor(resource: string) {
		super(`${resource} not found`, 404);
	}
}

/**
 * Global error handler middleware
 * This should be added **after all routes** in your Express app
 *
 * @param err - The thrown error (can be AppError, ZodError, or unknown)
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 */
export function errorHandler(
	err: unknown,
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	// -------------------------
	// 1️⃣ Handle Zod validation errors
	// Zod throws a ZodError when schema parsing fails
	// We convert it to a readable JSON format
	// -------------------------
	if (err instanceof ZodError) {
		const errors = err.issues.map((issue: ZodIssue) => ({
			// path is an array representing the location of the error in the object
			// join with '.' to get a human-readable field path
			field: issue.path.join("."),
			message: issue.message,
		}));

		res.status(400).json({
			success: false,
			error: "Validation failed",
			details: errors, // array of { field, message } objects
		});
		return;
	}

	// -------------------------
	// 2️⃣ Handle custom AppErrors
	// These are expected operational errors thrown in routes/middleware
	// -------------------------
	if (err instanceof AppError) {
		res.status(err.statusCode).json({
			success: false,
			error: err.message,
			// Include stack trace only in development for debugging
			...(process.env.NODE_ENV === "development" && { stack: err.stack }),
		});
		return;
	}

	// -------------------------
	// 3️⃣ Handle unknown/unexpected errors
	// These are programming errors or unexpected exceptions
	// -------------------------
	console.error("Unexpected error:", err);

	res.status(500).json({
		success: false,
		error:
			process.env.NODE_ENV === "production"
				? "Internal server error" // Generic message in production
				: (err as any).message, // Show actual error in development
	});
}
