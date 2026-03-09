import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny, z } from "zod";
import { AppError } from "./error.middleware";

/**
 * Middleware factory to validate req.query against a Zod schema.
 *
 * @template TSchema - The Zod schema type
 *
 * How it works:
 * - validateQuery(schema) returns a middleware function.
 * - If validation succeeds, validated data is stored in `_validatedQuery`.
 * - If validation fails, an AppError is thrown and handled by errorMiddleware.
 */
export function validateQuery<TSchema extends ZodTypeAny>(schema: TSchema) {
	type TQuery = z.infer<TSchema>;

	return (
		req: Request<unknown, unknown, unknown, Record<string, unknown>>,
		_res: Response,
		next: NextFunction,
	) => {
		const result = schema.safeParse(req.query);

		// If validation fails, throw a typed AppError
		if (!result.success) {
			const formattedErrors: Record<string, string> = {};

			// Flatten Zod issues to { field: message } format
			result.error.issues.forEach((issue) => {
				const field = issue.path[0] as string; // top-level field name
				formattedErrors[field] = issue.message;
			});

			// Pass the error to the centralized errorMiddleware
			return next(new AppError("Validation failed", 400, formattedErrors));
		}

		// Store validated query in a strongly-typed custom property
		(req as Request & { _validatedQuery?: TQuery })._validatedQuery =
			result.data;

		next();
	};
}
