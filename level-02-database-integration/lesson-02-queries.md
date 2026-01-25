# Lesson 2: Prisma Queries (Long-form Enhanced)

> This lesson goes beyond “CRUD calls” and shows how to write Prisma queries that are safe for APIs: selecting fields, handling not-found and conflicts, and thinking about pagination/performance.

## Table of Contents

- CRUD operations (`findMany`, `findUnique`, `create`, `update`, `delete`)
- Filtering, sorting, pagination (and clamping)
- Selecting fields (avoid leaking secrets)
- Translating Prisma errors into API errors (preview)
- Advanced patterns: cursor pagination, transactions, and avoiding N+1
- Troubleshooting checklist

## Learning Objectives

By the end of this lesson, you will be able to:
- Perform common Prisma operations: `findMany`, `findUnique`, `create`, `update`, `delete`
- Filter, sort, and paginate query results
- Select only needed fields (and avoid leaking sensitive data)
- Handle errors and “not found” cases correctly in an API
- Recognize common pitfalls (using `findUnique` incorrectly, assuming updates always succeed)

## Why Queries Matter

Your API ultimately needs to:
- read from the database
- write to the database
- return correct HTTP responses

Prisma gives you a consistent API for these operations, and TypeScript helps you keep queries and models aligned.

```mermaid
flowchart LR
  route[ExpressRoute] --> prisma[PrismaClient]
  prisma --> db[Database]
  db --> prisma
  prisma --> route
```

## `findMany` (List Records)

```typescript
const users = await prisma.user.findMany();
```

### Filtering, sorting, pagination

```typescript
const users = await prisma.user.findMany({
  where: { email: { contains: "@example.com" } },
  orderBy: { createdAt: "desc" },
  take: 20,
  skip: 0,
});
```

## `findUnique` (Fetch One by Unique Field)

Use `findUnique` with a unique constraint (like `id` or `email`).

```typescript
const user = await prisma.user.findUnique({
  where: { id: 1 },
});
```

### Handling not found

`findUnique` returns `null` if nothing matches:

```typescript
if (!user) {
  // respond 404 in your API layer
}
```

## `create` (Insert Record)

```typescript
const user = await prisma.user.create({
  data: {
    email: "alice@example.com",
    name: "Alice",
  },
});
```

### Validation reminder

Prisma enforces schema constraints, but you should still validate request input before calling the DB.

## `update` (Modify Record)

```typescript
const user = await prisma.user.update({
  where: { id: 1 },
  data: { name: "Alice Updated" },
});
```

### Important behavior

If the record doesn’t exist, `update` throws an error (it does not return `null`).
Many APIs check existence first, or catch and translate the error to a 404.

## `delete` (Remove Record)

```typescript
await prisma.user.delete({
  where: { id: 1 },
});
```

`delete` also throws if the record doesn’t exist.

## Selecting Fields (Avoid Leaking Secrets)

If your model contains sensitive fields (like `passwordHash`), never return them from your API.

```typescript
const users = await prisma.user.findMany({
  select: { id: true, email: true, name: true, createdAt: true },
});
```

## Real-World Scenario: Building CRUD Endpoints

Typical pattern in an Express handler:
- validate input
- call Prisma
- return typed JSON + correct status code
- translate errors into stable API errors

## Best Practices

### 1) Return consistent response shapes

Decide whether you return raw objects or `{ data: ... }` envelopes and stick to it.

### 2) Handle “not found” explicitly

Use 404 when a resource isn’t found; don’t return 200 with `null`.

### 3) Avoid overfetching

Use `select` to return only fields you need.

## Common Pitfalls and Solutions

### Pitfall 1: Using `findUnique` with a non-unique filter

**Problem:** You try `findUnique` on a non-unique field; Prisma rejects it.

**Solution:** Use `findFirst` or `findMany` for non-unique filters.

### Pitfall 2: Assuming `update` returns `null` when missing

**Problem:** You expect “not found” to return null, but Prisma throws.

**Solution:** Check existence first or catch and translate the error.

### Pitfall 3: Returning full user objects

**Problem:** You accidentally leak sensitive fields.

**Solution:** Use `select` and define DTO types for responses.

## Troubleshooting

### Issue: Unique constraint errors

**Symptoms:**
- errors when creating/updating unique fields (email)

**Solutions:**
1. Check if the record exists first (409 conflict).
2. Catch the Prisma error and return a stable API error response.

### Issue: Query returns empty results

**Symptoms:**
- `findMany` returns `[]`

**Solutions:**
1. Confirm your filters are correct.
2. Confirm you’re connected to the expected database (`DATABASE_URL`).

---

## Advanced Query Patterns (Reference)

### 1) Pagination: offset vs cursor

You’ve seen offset pagination:
- `skip` + `take`

Offset pagination is simple, but has trade-offs:
- large offsets can get slow
- if data changes between requests, items can “shift” between pages

Cursor pagination is often better for large datasets:

```typescript
// Cursor pagination (example idea)
const pageSize = 20;
const cursorId = req.query.cursor ? Number(req.query.cursor) : undefined;

const users = await prisma.user.findMany({
  take: pageSize,
  ...(cursorId ? { skip: 1, cursor: { id: cursorId } } : {}),
  orderBy: { id: "asc" },
  select: { id: true, email: true, name: true, createdAt: true },
});
```

**Key idea:** the next page uses the last item’s id as the cursor.

### 2) Translate Prisma errors into stable API responses (preview)

In real APIs, you typically map:
- unique constraint violation → **409 Conflict**
- not found on update/delete → **404 Not Found**

Prisma throws typed errors that you can detect (example):

```typescript
import { Prisma } from "@prisma/client";

try {
  await prisma.user.create({ data: { email, name } });
} catch (err) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Example: unique constraint
    if (err.code === "P2002") {
      // return 409 in your API layer
    }
  }
  throw err;
}
```

You don’t need to implement full error mapping yet, but start thinking:
> DB errors are not API responses. Translate them.

### 3) Transactions (preview)

Use transactions when multiple DB operations must succeed or fail together.

```typescript
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: { email, name } });
  // const profile = await tx.profile.create({ data: { userId: user.id, ... } });
  return user;
});
```

### 4) Avoid N+1 queries

A common anti-pattern is querying related data in a loop:

```typescript
// ❌ N+1 pattern (conceptual)
const posts = await prisma.post.findMany();
for (const post of posts) {
  await prisma.user.findUnique({ where: { id: post.userId } });
}
```

Prefer relation queries with `include`/`select` when appropriate (see Relationships lesson).

### 5) Principle: select only what you need

Even if your model has sensitive fields, `select` prevents accidental leaks:

```typescript
const users = await prisma.user.findMany({
  select: { id: true, email: true, name: true },
});
```

## Next Steps

Now that you can query with Prisma:

1. ✅ **Practice**: Implement list + detail endpoints with `findMany`/`findUnique`
2. ✅ **Experiment**: Add `select` to avoid overfetching
3. 📖 **Next Lesson**: Learn about [Relationships](./lesson-03-relationships.md)
4. 💻 **Complete Exercises**: Work through [Exercises 02](./exercises-02.md)

## Additional Resources

- [Prisma Docs: Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client)
- [Prisma Docs: Filtering and Sorting](https://www.prisma.io/docs/concepts/components/prisma-client/filtering-and-sorting)

---

**Key Takeaways:**
- Prisma operations cover CRUD: find, create, update, delete.
- `findUnique` returns `null` when missing; `update/delete` typically throw when missing.
- Use filters, ordering, and pagination for real endpoints.
- Use `select` to avoid leaking sensitive data and to reduce overfetching.
