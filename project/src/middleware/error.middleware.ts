import { NextFunction, Request, Response } from "express";
import { ZodError, ZodFormattedError } from "zod";

/**
 * Custom application error class.
 *
 * Generic `TDetails` allows passing strongly-typed additional information
 * about the error (e.g., validation errors) without using `any`.
 */
export class AppError<
	TDetails extends Record<string, string> | undefined = undefined,
> extends Error {
	statusCode: number;
	details?: TDetails;

	constructor(message: string, statusCode = 500, details?: TDetails) {
		super(message);
		this.statusCode = statusCode;
		this.details = details;
		this.name = "AppError";

		// Maintains proper prototype chain for instanceof checks
		Object.setPrototypeOf(this, AppError.prototype);
	}
}

/**
 * Centralized error-handling middleware for Express.
 *
 * This middleware catches:
 * 1. Zod validation errors (from schemas)
 * 2. Custom application errors (AppError)
 * 3. Any other unhandled errors
 *
 * Always placed **after all routes** in Express:
 * app.use(errorMiddleware);
 */
export const errorMiddleware = (
	err: unknown,
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	// Log the full error stack to the server console for debugging
	console.error(err);

	// ✅ Handle Zod validation errors
	if (err instanceof ZodError) {
		/**
		 * `err.format()` generates a nested object showing
		 * which fields failed validation and why.
		 *
		 * Example:
		 * {
		 *   username: { _errors: ["Username is required"] },
		 *   password: { _errors: ["Password must be >= 8 characters"] }
		 * }
		 */
		const formattedErrors: Record<string, string> = {};

		for (const [key, value] of Object.entries(err.format())) {
			if (
				"_errors" in value &&
				Array.isArray(value._errors) &&
				value._errors.length > 0
			) {
				formattedErrors[key] = value._errors[0]; // take first error per field
			}
		}

		return res.status(400).json({
			success: false,
			message: "Validation Failed",
			errors: formattedErrors,
		});
	}

	// ✅ Handle custom application errors
	if (err instanceof AppError) {
		return res.status(err.statusCode).json({
			success: false,
			message: err.message,
			// include additional details if available (e.g., field errors)
			...(err.details && { details: err.details }),
		});
	}

	// ✅ Fallback for unknown errors
	return res.status(500).json({
		success: false,
		message: err instanceof Error ? err.message : "Internal Server Error",
	});
};
