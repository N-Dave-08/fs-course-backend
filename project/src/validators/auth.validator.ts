import { z } from "zod";

export const registerSchema = z.object({
	email: z.string().email("invalid email"),
	password: z.string().min(8, "password must be minimum of 8 characters"),
	name: z.string().min(3, "name must be minimum of 3 characters"),
    age: z.int().positive("age must be a positive number"),
    bio: z.string().optional()
});

export const loginSchema = z.object({
	email: z.string().email("invalid email"),
	password: z.string().min(8, "password must be minimum of 8 characters"),
});
