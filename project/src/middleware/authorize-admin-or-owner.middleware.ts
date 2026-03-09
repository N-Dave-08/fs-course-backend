import { AuthRequest } from "../types/auth-request";
import { NextFunction, Response } from "express";
import { sendForbiddenError } from "../utils/error";

export function authorizeOwnerOrAdmin(
	getOwnerId: (req: AuthRequest) => number,
) {
	return (req: AuthRequest, res: Response, next: NextFunction) => {
		const user = req.user;

		if (!user) {
			return res.status(401).json({ error: "unauthorized" });
		}

		const ownerId = getOwnerId(req);

		const isAdmin = user.roles.includes("admin");

		if (!isAdmin && user.id !== ownerId) {
			return sendForbiddenError(res);
		}

		next();
	};
}
