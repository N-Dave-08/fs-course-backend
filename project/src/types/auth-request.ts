import { Request } from "express";

/*
This interface EXTENDS Express Request.

Meaning:
AuthRequest = normal Express Request + user property

We do this because Express Request normally does not contain "user".
*/
export interface AuthRequest extends Request {
	user?: {
		id: number;
		roles: string[];
	};
}
