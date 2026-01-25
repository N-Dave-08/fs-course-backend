# Lesson 1: RESTful APIs

## Learning Objectives

By the end of this lesson, you will be able to:
- Explain REST principles and what “resource-oriented” APIs mean
- Map CRUD operations to HTTP methods and routes
- Choose appropriate status codes for common API outcomes
- Understand when to use `PUT` vs `PATCH`
- Recognize common pitfalls (inconsistent routes, wrong status codes, leaking implementation details)

## Why REST Matters

REST is a widely used set of conventions for building HTTP APIs.

It makes APIs easier to:
- understand
- document
- consume from multiple clients (web, mobile, services)

```mermaid
flowchart LR
  resource[Resource] --> routes[Routes]
  routes --> methods[HTTPMethods]
  methods --> responses[StatusCodesAndJSON]
```

## REST Principles (Practical)

- resources are nouns (users, posts)
- routes represent collections and single resources
- use HTTP verbs to describe actions on resources
- use status codes to describe outcomes

### HTTP methods

- **GET**: retrieve resources
- **POST**: create resources
- **PUT**: replace/update a resource (full update)
- **PATCH**: partial update
- **DELETE**: delete a resource

## RESTful Routes (Example: Users)

```text
GET    /users         # list users
GET    /users/:id     # get one user
POST   /users         # create user
PUT    /users/:id     # replace/update user
PATCH  /users/:id     # partial update user
DELETE /users/:id     # delete user
```

### Route design tips

- collections: plural nouns (`/users`)
- single resource: add `/:id`
- avoid verbs in routes when a method already describes the action (avoid `/getUsers`)

## Status Codes (Common)

```typescript
res.status(200).json(data); // OK
res.status(201).json(data); // Created
res.status(204).send();     // No Content (commonly used for deletes)
res.status(400).json({ error: "Bad request" }); // Invalid input
res.status(401).json({ error: "Unauthorized" }); // Not logged in
res.status(403).json({ error: "Forbidden" }); // Logged in but not allowed
res.status(404).json({ error: "Not found" }); // Missing resource
res.status(409).json({ error: "Conflict" }); // Unique constraint conflicts
res.status(500).json({ error: "Server error" }); // Unexpected failure
```

## `PUT` vs `PATCH`

### `PUT`

Use when the client sends the full new representation of the resource (or you treat it that way).

### `PATCH`

Use when the client sends only the fields they want to change.

In practice, many APIs use `PATCH` for updates because “partial updates” are common.

## Real-World Scenario: Designing an API for a Frontend

Your frontend needs:
- list pages (GET collection)
- detail pages (GET by id)
- forms (POST/PUT/PATCH)
- delete actions (DELETE)

Good REST design makes these interactions straightforward.

## Best Practices

### 1) Be consistent across resources

If `/users/:id` uses `PATCH`, don’t make `/posts/:id` use a completely different pattern without a reason.

### 2) Return stable error shapes

Clients should be able to display error messages without parsing random formats.

### 3) Don’t leak internals

Avoid returning stack traces or database error details to clients in production.

## Common Pitfalls and Solutions

### Pitfall 1: Using wrong status codes

**Problem:** You return 200 for everything, even failures.

**Solution:** Use 4xx for client errors, 5xx for server errors, 201 for creates, 204 for deletes.

### Pitfall 2: Inconsistent resource naming

**Problem:** `/user`, `/getUser`, `/usersList`.

**Solution:** Use plural nouns consistently: `/users`.

### Pitfall 3: Treating all errors as 500

**Problem:** Validation errors become 500 and confuse clients.

**Solution:** Validate inputs and return 400/409/404 appropriately.

## Troubleshooting

### Issue: Frontend can’t tell if a request succeeded

**Symptoms:**
- same status code and shape for success and error

**Solutions:**
1. Use standard status codes.
2. Use consistent response formatting (next lesson).

## Next Steps

Now that you understand REST fundamentals:

1. ✅ **Practice**: Design routes for `posts` and `comments`
2. ✅ **Experiment**: Add `PATCH` vs `PUT` semantics to an update endpoint
3. 📖 **Next Lesson**: Learn about [Request Handling](./lesson-02-request-handling.md)
4. 💻 **Complete Exercises**: Work through [Exercises 03](./exercises-03.md)

## Additional Resources

- [MDN: HTTP methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)
- [MDN: HTTP status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

---

**Key Takeaways:**
- REST is resource-oriented: nouns for routes, verbs for HTTP methods.
- Use consistent CRUD routes across resources.
- Status codes communicate outcomes; use them intentionally.
- `PATCH` is often used for partial updates; `PUT` for full replace/update.
