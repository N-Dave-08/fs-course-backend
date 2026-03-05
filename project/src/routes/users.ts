import { type Request, type Response, Router } from "express";
import { prisma } from "../lib/prisma";

const router: Router = Router();

// GET /api/users
router.get("/", async (res: Response) => {
	try {
		const users = await prisma.user.findMany({
			orderBy: { createdAt: "desc" },
		});
		res.json(users);
	} catch (error) {
		console.error("error fetching users:", error);
		res.status(500).json({ error: "failed to fetch users" });
	}
});

// GET /api/users/:id
router.get("/:id", async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id as string);

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

// PUT /api/users/:id
router.put("/:id", async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id as string);

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
		const id = Number(req.params.id as string);

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
