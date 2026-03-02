import type { NextFunction, Request, Response } from "express";

export default function logger(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	const timestamp = new Date().toISOString();
	console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
	next();
}
