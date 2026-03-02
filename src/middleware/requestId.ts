import type { NextFunction, Request, Response } from "express";

export default function requestIdMiddleware(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	const requestId =
		req.headers["x-request-id"]?.toString() ?? crypto.randomUUID();
	res.setHeader("x-request-id", requestId);
	(req as any).requestId = requestId;
	next();
}
