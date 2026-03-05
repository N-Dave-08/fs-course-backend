export interface User {
	id?: number;
	email: string;
	name: string;
	age: number;
	bio: string;
}

export const users: User[] = Array.from({ length: 50 }, (_, i) => ({
	// id: i + 1,
	email: `user-${i + 1}@gmail.com`,
	name: `User ${i + 1}`,
	age: Math.floor(Math.random() * (30 - 20 + 1)) + 20,
	bio: `Hello my name is user-${i + 1}`,
}));
