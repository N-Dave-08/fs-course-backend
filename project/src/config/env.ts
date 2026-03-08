export const env = {
	get jwtSecret(): string {
		const value = process.env.JWT_SECRET;
		if (!value) {
			throw new Error("missing required environment variable: JWT_SECRET");
		}
		return value;
	},
} as const;
