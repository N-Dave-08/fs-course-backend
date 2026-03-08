import jwt from "jsonwebtoken";
import { env } from "../config/env";

/*
Generate a token containing user info.
jwt.sign(payload, secret, options)
*/
export function generateToken(userId: number, roles: string[]) {
	return jwt.sign(
		// payload stored in token
		{ id: userId, roles },
		// secret used to sign tokens
		env.jwtSecret,
		{ expiresIn: "1h" },
	);
}

/*
Verify and decode a token.

The "as {...}" part is a TypeScript type assertion.
We tell TypeScript what shape the decoded payload has.
*/
export function verifyToken(token: string) {
	return jwt.verify(token, env.jwtSecret) as {
		id: number;
		roles: string[];
	};
}
