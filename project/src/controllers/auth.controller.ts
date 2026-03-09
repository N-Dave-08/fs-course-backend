import { Response } from "express";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt";
import { AuthRequest } from "../types/auth-request";

/*
REGISTER USER
*/
export async function register(req: AuthRequest, res: Response) {
	try {
		const { email, password, name, age, bio } = req.body;

		const existingUser = await prisma.user.findUnique({
			where: {
				email,
			},
		});

		if (existingUser) {
			return res.status(400).json({ error: "user already exists" });
		}

		if (password.length < 8) {
			return res.status(400).json({
				success: false,
				error: "password must be at least 8 characters",
			});
		}

		/*
	    Hash the password before storing it.

	    bcrypt.hash(password, saltRounds)
	    */
		const hashedPassword = await bcrypt.hash(password, 10);

		const user = await prisma.user.create({
			data: {
				email,
				password: hashedPassword,
				name,
				age,
				bio,
			},
			select: {
				id: true,
				name: true,
				email: true,
				age: true,
				bio: true,
				roles: {
					select: {
						roles: {
							select: {
								name: true,
							},
						},
					},
				},
			},
		});

		const userRole = await prisma.role.findUnique({
			where: { name: "USER" },
		});

		if (userRole) {
			await prisma.userRole.create({
				data: {
					userId: user.id,
					roleId: userRole.id,
				},
			});
		}

		return res.status(201).json({
			message: "user created",
			userId: user.id,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "internal server error" });
	}
}

/*
LOGIN USER
*/
export async function login(req: AuthRequest, res: Response) {
	try {
		const { email, password } = req.body;

		const user = await prisma.user.findUnique({
			where: {
				email,
			},
			include: {
				roles: {
					include: { roles: true },
				},
			},
		});

		if (!user) {
			return res.status(401).json({ error: "invalid credentials" });
		}

		/*
	    bcrypt.compare compares
	    plain password vs hashed password
	    */
		const validPassword = await bcrypt.compare(password, user.password);

		if (!validPassword) {
			return res.status(401).json({ error: "invalid credentials" });
		}

		const roleNames = user.roles.map((r) => r.roles.name);

		const token = generateToken(user.id, roleNames);

		return res.json({ token });
	} catch (error) {
		console.error(error);
		throw error;
	}
}

/*
Get the currently logged-in user's info
*/
export async function me(req: AuthRequest, res: Response) {
	const userId = req.user?.id;

	if (!userId) {
		return res.status(401).json({ error: "unauthorized" });
	}

	try {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				name: true,
				email: true,
				age: true,
				bio: true,
				roles: {
					select: {
						roles: {
							select: {
								name: true,
							},
						},
					},
				},
			},
		});

		if (!user) {
			return res.status(404).json({ error: "user not found" });
		}

		const roleNames = user.roles.map((ur) => ur.roles.name);

		return res.json({
			id: user.id,
			name: user.name,
			email: user.email,
			bio: user.bio,
			age: user.age,
			roles: roleNames,
		});
	} catch (error) {
		console.error(error);
		throw error;
	}
}
