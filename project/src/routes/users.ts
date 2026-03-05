import type { Request, Response } from "express";
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { users } from "../helpers/users";

const router: Router = Router();

// GET /api/users
router.get("/", async (req: Request, res: Response) => {
	try {
		const page = Math.max(1, Number(req.query.page) || 1);
		const limit = Math.min(100, Number(req.query.limit) || 10);

		const offset = (page - 1) * limit;

		const [users, totalItems] = await Promise.all([
			// users
			prisma.user.findMany({
				skip: offset,
				take: limit,
				orderBy: { id: "asc" },
			}),
			// totalItems
			prisma.user.count(),
		]);

		const totalPages = Math.ceil(totalItems / limit);

		res.json({
			page,
			limit,
			totalItems,
			totalPages,
			hasNextPage: page < totalPages,
			hasPrevPage: page > 1,
			users,
		});
	} catch (error) {
		console.error("error fetching users:", error);
		res.status(500).json({ error: "failed to fetch users" });
	}
});

// GET /api/users/:id
router.get("/:id", async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ error: "invalid user id" });
		}

		const user = await prisma.user.findUnique({
			where: {
				id: id,
			},
		});

		if (!user) {
			return res.status(404).json({ error: "user not found" });
		}
	} catch (error) {
		console.error("error fetching user: ", error);
		res.status(500).json({ error: "failed to fetch user" });
	}
});

// POST /api/users
router.post("/", async (req: Request, res: Response) => {
	try {
		const { email, name, age, bio } = req.body;

		if (!email || !name || !age) {
			return res
				.status(400)
				.json({ error: "email, name, and age are required" });
		}

		const existingUser = await prisma.user.findUnique({
			where: {
				email: email,
			},
		});

		if (existingUser) {
			return res.status(409).json({ error: "email already exist" });
		}

		const newUser = await prisma.user.create({
			data: {
				email,
				name,
				age: Number(age),
				bio,
			},
		});

		res.status(201).json(newUser);
	} catch (error) {
		console.error("error creating user: ", error);
		res.status(500).json({ error: "failed to create user" });
	}
});

// create many users
router.post("/create-many-users", async (res: Response) => {
	try {
		await prisma.user.createMany({
			data: users,
			skipDuplicates: true,
		});

		res.json({ message: "successfully created dummy users" });
	} catch (error) {
		console.error("error creating many users:", error);
		res.status(500).json({ error: "failed to create many users" });
	}
});

// PUT /api/users/:id
router.put("/:id", async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ error: "invalid user id" });
		}

		const { email, name, age, bio } = req.body;

		const existingUser = await prisma.user.findUnique({
			where: {
				id: id,
			},
		});

		if (!existingUser) {
			return res.status(409).json({ error: "user not found" });
		}

		if (email && email !== existingUser.email) {
			const emailExists = await prisma.user.findUnique({
				where: { email },
			});
			if (emailExists) {
				return res.status(409).json({ error: "email already exists" });
			}
		}

		const user = await prisma.user.update({
			where: { id },
			data: {
				...(email && { email }),
				...(name && { name }),
				...(age && { age }),
				...(bio && { bio }),
			},
		});

		res.json(user);
	} catch (error) {
		console.error("error updating user:", error);
		res.status(500).json({ error: "failed updating user" });
	}
});

// DELETE /api/users/:id
router.delete("/:id", async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ error: "invalid user id" });
		}

		const user = await prisma.user.findUnique({
			where: {
				id: id,
			},
		});

		if (!user) {
			return res.status(404).json({ error: "user not found" });
		}

		await prisma.user.delete({
			where: {
				id,
			},
		});

		res.status(204).send();
	} catch (error) {
		console.error("error fetching user: ", error);
		res.status(500).json({ error: "failed to delete user" });
	}
});

export default router;
