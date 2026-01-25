# API Design Patterns

## RESTful Structure

- Use nouns for resources
- Use HTTP methods appropriately
- Return consistent response formats
- Use proper status codes

## Controller Pattern

```typescript
// controllers/users.ts
export async function getUsers(req, res) {
  const users = await prisma.user.findMany();
  res.json({ success: true, data: users });
}
```

## Service Pattern

```typescript
// services/userService.ts
export class UserService {
  async findById(id: number) {
    return prisma.user.findUnique({ where: { id } });
  }
}
```
