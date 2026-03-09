import z from "zod";

export const updateUserSchema = z.object({
	name: z.string().min(3).optional(),
	email: z.string().email().optional(),
	age: z.number().int().positive().optional(),
	bio: z.string().max(500).optional(),
});
