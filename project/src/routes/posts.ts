import { type Request, type Response, Router } from "express";
import { prisma } from "../lib/prisma";

const router: Router = Router();

// GET /api/posts
router.get("/", async (req: Request, res: Response) => {
	try {
		const posts = await prisma.post.findMany({
			include: {
				author: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});
		res.json(posts);
	} catch (error) {
		console.error("error fetching posts:", error);
		res.status(500).json({ error: "failed to fetch posts" });
	}
});

// GET /api/posts/:id
router.get("/:id", async (req: Request, res: Response) => {
	try {
		const id = parseInt(req.params.id as string);

		if (isNaN(id)) {
			return res.status(400).json({ error: "invalid user id" });
		}

		const post = await prisma.post.findUnique({
			where: {
				id: id,
			},
			include: {
				author: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});

		if (!post) {
			return res.status(404).json({ error: "post not found" });
		}

		res.json(post);
	} catch (error) {
		console.error("error fetching post: ", error);
		res.status(500).json({ error: "failed to fetch post" });
	}
});

// POST /api/posts
router.post("/", async (req: Request, res: Response) => {
	try {
		const { title, content, published, authorId } = req.body;

		if (!title || !content || !authorId) {
			return res
				.status(400)
				.json({ error: "title, content, and authorId are required" });
		}

		const author = await prisma.user.findUnique({
			where: {
				id: authorId,
			},
		});

		if (!author) {
			return res.status(404).json({ error: "author not found" });
		}

		const newPost = await prisma.post.create({
			data: {
				title,
				content,
				published: published || false,
				authorId,
			},
			include: {
				author: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});

		res.status(201).json(newPost);
	} catch (error) {
		console.error("error creating post: ", error);
		res.status(500).json({ error: "failed to create post" });
	}
});

// PUT /api/posts/:id
router.put("/:id", async (req: Request, res: Response) => {
	try {
		const id = parseInt(req.params.id as string);

		if (isNaN(id)) {
			return res.status(400).json({ error: "invalid user id" });
		}

		const { title, content, published, authorId } = req.body;

		const existingPost = await prisma.post.findUnique({
			where: {
				id: id,
			},
		});

		if (!existingPost) {
			return res.status(409).json({ error: "post not found" });
		}

		// if (email && email !== existingUser.email) {
		// 	const emailExists = await prisma.user.findUnique({
		// 		where: { email },
		// 	});
		// 	if (emailExists) {
		// 		return res.status(409).json({ error: "email already exists" });
		// 	}
		// }

		const post = await prisma.post.update({
			where: { id },
			data: {
				...(title && { title }),
				...(content && { content }),
				...(published && { published }),
				...(authorId && { authorId }),
			},
		});

		res.json(post);
	} catch (error) {
		console.error("error updating post:", error);
		res.status(500).json({ error: "failed updating post" });
	}
});

// DELETE /api/posts/:id
router.delete("/:id", async (req: Request, res: Response) => {
	try {
		const id = parseInt(req.params.id as string);

		if (isNaN(id)) {
			return res.status(400).json({ error: "invalid user id" });
		}

		const post = await prisma.post.findUnique({
			where: {
				id: id,
			},
		});

		if (!post) {
			return res.status(404).json({ error: "post not found" });
		}

		await prisma.post.delete({
			where: {
				id,
			},
		});

		res.status(204).send();
	} catch (error) {
		console.error("error fetching post: ", error);
		res.status(500).json({ error: "failed to delete post" });
	}
});

export default router;
