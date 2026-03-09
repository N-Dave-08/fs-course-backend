import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny, z } from "zod";
import { AppError } from "./error.middleware"; // Custom error class

/**
 * Middleware factory to validate `req.params` against a Zod schema.
 *
 * @template TSchema - Zod schema type
 *
 * How it works:
 * 1. Returns an Express middleware function.
 * 2. Validates `req.params` without throwing.
 * 3. If validation passes:
 *      - Replaces `req.params` with the validated, type-safe data.
 *      - Calls `next()` to proceed to the next middleware or controller.
 * 4. If validation fails:
 *      - Creates an AppError containing formatted validation errors.
 *      - Passes the error to the centralized error middleware via `next(err)`.
 *
 * @param schema - Zod schema to validate the request parameters
 */
export function validateParams<TSchema extends ZodTypeAny>(schema: TSchema) {
	// TypeScript type inferred from the schema
	type TParams = z.infer<TSchema>;

	return (req: Request, res: Response, next: NextFunction) => {
		// Perform validation using safeParse (does not throw)
		const result = schema.safeParse(req.params);

		if (!result.success) {
			// Format validation errors as a simple key-value object
			const formattedErrors: Record<string, string> = {};
			result.error.issues.forEach((issue) => {
				const field = issue.path[0] as string; // top-level field name
				formattedErrors[field] = issue.message;
			});

			// Forward the error to centralized error middleware
			return next(new AppError("Validation failed", 400, formattedErrors));
		}

		// Overwrite req.params with validated and typed data
		(req as Request<TParams>).params = result.data;

		// Proceed to the next middleware or controller
		next();
	};
}
