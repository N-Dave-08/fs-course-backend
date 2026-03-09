import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt";
import { AuthRequest } from "../types/auth-request";
import { AppError } from "./error-handler";

export function authenticate(
	req: AuthRequest,
	res: Response,
	next: NextFunction,
) {
	const autheHeader = req.headers.authorization;

	/*
	Authorization header format:

	Authorization: Bearer TOKEN
	*/

	if (!autheHeader) {
		return res.status(401).json({ error: "no token provided" });
	}

	/*
	split(" ") turns:

	"Bearer TOKEN"

	into

	["Bearer", "TOKEN"]
	*/
	const token = autheHeader.split(" ")[1];

	/*
	Attach user info to request object.

	This allows later middleware/controllers
	to know who made the request.
	*/
	try {
		const decoded = verifyToken(token);

		req.user = {
			id: decoded.id,
			roles: decoded.roles,
		};

		next();
	} catch {
		throw new AppError("Invalid Token", 401);
	}
}
