import { type Request, type Response, Router } from "express";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validation";

const router: Router = Router();

interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

// GET /api/articles
router.get("/", async (req: Request, res: Response) => {
	try {
		const articles = await prisma.article.findMany({
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

        const response: ApiResponse<typeof articles> = {
            success: true,
            data: articles,
            message: "articles successfully fetched"
        }

		res.status(200).json(response);
	} catch (error) {
		console.error("error fetching articles:", error);
        const response: ApiResponse<null> = {
            success: false,
            error: "failed to fetch articles"
        }
		res.status(500).json(response);
	}
});

// GET /api/articles/:id
router.get("/:id", async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
            const response: ApiResponse<null> = {
                success: false,
                error: "invalid user id"
            }
			return res.status(400).json(response);
		}

		const article = await prisma.article.findUnique({
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

		if (!article) {
             const response: ApiResponse<null> = {
                success: false,
                error: "article not found"
            }
			return res.status(400).json(response);
		}

        const response: ApiResponse<typeof article> = {
                success: true,
                data: article,
                message: "article successfully fetch"
            }

		res.status(200).json(response);
	} catch (error) {
		console.error("error fetching post: ", error);
		const response: ApiResponse<null> = {
                success: false,
                error: "failed to fecth article"
            }
			return res.status(500).json(response);
	}
});

// POST /api/articles
router.post("/", validate([
        { field: "title", required: true, type: "string", minLength: 3 },
        { field: "content", required: true, type: "string", minLength: 5 },
        { field: "published", required: true, type: "boolean" },
        { field: "authorId", required: true, type: "number" },
    ]), async (req: Request, res: Response) => {
	try {
		const { title, content, published, authorId } = req.body;

		if (!title || !content || !authorId) {
			const response: ApiResponse<null> = {
				success: false,
				error: "title, content, and authorId are required",
			};
			return res.status(400).json(response);
		}

		const author = await prisma.user.findUnique({
			where: {
				id: authorId,
			},
		});

		if (!author) {
			const response: ApiResponse<null> = {
				success: false,
				error: "author not found",
			};
			return res.status(404).json(response);
		}

		const newArticle = await prisma.article.create({
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

		const response: ApiResponse<typeof newArticle> = {
			success: true,
			data: newArticle,
			message: "article created successfully",
		};

		res.status(201).json(response);
	} catch (error) {
		console.error(error);
		const response: ApiResponse<null> = {
			success: false,
			error: "failed to create article",
		};
		res.status(500).json(response);
	}
});

// PUT /api/articles/:id
router.put("/:id", async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
            const response: ApiResponse<null> = {
                success: false,
                message: "invalid user id"
            }
			return res.status(400).json(response);
		}

		const { title, content, published, authorId } = req.body;

		const existingArticle = await prisma.article.findUnique({
			where: {
				id: id,
			},
		});

		if (!existingArticle) {
            const response: ApiResponse<null> = {
                success: false,
                message: "article not found"
            }
			return res.status(404).json(response);
		}

		const article = await prisma.article.update({
			where: { id },
			data: {
				...(title !== undefined && { title }),
				...(content !== undefined && { content }),
				...(published !== undefined && { published }),
				...(authorId !== undefined && { authorId }),
			},
		});

        const response: ApiResponse<typeof article> = {
            success: true,
            data: article,
            message: `successfully updated article ${article.id}`
        }

		res.status(200).json(response);
	} catch (error) {
		console.error("error updating post:", error);
        const response: ApiResponse<null> = {
            success: false,
            error: "failed updating post"
        }
		res.status(500).json(response);
	}
});

// DELETE /api/posts/:id
router.delete("/:id", async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
            const response: ApiResponse<null> = {
                success: false,
                message: "invalid user id"
            }
			return res.status(400).json(response);
		}

		const article = await prisma.article.findUnique({
			where: {
				id: id,
			},
		});

		if (!article) {
            const response: ApiResponse<null> = {
                success: false,
                message: "article not found"
            }
			return res.status(404).json(response);
		}

		await prisma.article.delete({
			where: {
				id,
			},
		});

		const response: ApiResponse<null> = {
            success: true,
            message: "article successfully deleted"
        }

		res.status(200).json(response);
	} catch (error) {
		console.error("error fetching post: ", error);
        const response: ApiResponse<null> = {
            success: false,
            message: "failed to delete post"
        }
		res.status(500).json(response);
	}
});

export default router;
