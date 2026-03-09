import { Response } from "express";

interface ErrorField {
	field: string;
	message: string;
}

interface ErrorResponse {
	success: false;
	error: string;
	errors?: ErrorField[];
	details?: unknown;
}

export function sendError(
	res: Response,
	statusCode: number,
	message: string,
	errors?: ErrorField[],
	details?: unknown,
): void {
	const response: ErrorResponse = {
		success: false,
		error: message,
	};

	if (errors) response.errors = errors;
	if (details) response.details = details;

	res.status(statusCode).json(response);
}

export function sendValidationError(res: Response, errors: ErrorField[]): void {
	sendError(res, 400, "Validation Failed", errors);
}

export function sendNotFoundError(res: Response, resource: string): void {
	sendError(res, 404, `${resource} not found`);
}

export function sendUnauthorizedError(
	res: Response,
	message: string = "Unauthorized",
): void {
	sendError(res, 401, message);
}

export function sendForbiddenError(
	res: Response,
	message: string = "Forbidden",
): void {
	sendError(res, 403, message);
}

export function sendInternalError(
	res: Response,
	message: string = "Internal Server Error",
): void {
	sendError(res, 500, message);
}
