export interface User {
	id: number;
	name: string;
}

export const users: User[] = Array.from({ length: 50 }, (_, i) => ({
	id: i + 1,
	name: `User ${i + 1}`,
}));
