# Lesson 2: Request Handling (Long-form Enhanced)

> Request handling is where most real-world bugs live: parsing, validation, normalization, and safe defaults. This long-form lesson adds advanced boundary patterns you’ll reuse across your API.

## Table of Contents

- Boundary mindset: treat everything as untrusted
- Parsing and validating `req.body`, `req.params`, `req.query`
- TypeScript request typing (and why it’s not enough)
- Normalization (trim, case, clamping)
- Advanced patterns: schema validation, coercion helpers, and consistent 400 errors
- Troubleshooting checklist

## Learning Objectives

By the end of this lesson, you will be able to:
- Read and validate request bodies (`req.body`) safely
- Parse and validate route params (`req.params`) correctly
- Parse query params (`req.query`) for filtering/pagination
- Add TypeScript typing to requests to reduce runtime bugs
- Recognize common pitfalls (missing JSON parser, string/number mismatch, trusting user input)

## Why Request Handling Matters

Request handling is your backend’s boundary with the outside world.
Everything arriving from the client should be treated as **untrusted input** until validated.

Good request handling:
- prevents crashes and weird edge cases
- enables better error messages (400 vs 500)
- makes your API predictable for clients

```mermaid
flowchart LR
  input[ClientInput] --> parse[Parse]
  parse --> validate[Validate]
  validate --> handler[BusinessLogic]
  handler --> response[Response]
```

## Request Body (`req.body`)

Request bodies are typically used for creates/updates.

```typescript
app.post("/users", (req, res) => {
  const { name, email } = req.body;
  // Process data
});
```

### Important: JSON parsing middleware

If you don’t use `express.json()`, `req.body` will often be `undefined`:

```typescript
app.use(express.json());
```

## Route Params (`req.params`)

Params come from route patterns like `/users/:id`.

```typescript
app.get("/users/:id", (req, res) => {
  const { id } = req.params; // always a string
  // Use id
});
```

### Convert + validate params early

```typescript
const id = Number(req.params.id);
if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
```

## Query Params (`req.query`)

Query params are typically used for filters and pagination.

```typescript
app.get("/users", (req, res) => {
  const { page, limit } = req.query; // string | string[] | undefined
  // Use query params
});
```

### Example: safe pagination defaults

```typescript
const page = Math.max(1, Number(req.query.page ?? 1));
const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
```

## Type-Safe Requests (TypeScript)

Typing request bodies improves safety and autocomplete, but remember:
**types do not validate runtime data**.

```typescript
import type { Request } from "express";

interface CreateUserRequest {
  name: string;
  email: string;
}

app.post("/users", (req: Request<{}, {}, CreateUserRequest>, res) => {
  const { name, email } = req.body;
  res.json({ name, email });
});
```

### Recommended approach

- use TypeScript types for compile-time safety
- use runtime validation (e.g., Zod) for real safety (covered later)

## Real-World Scenario: Building a Create Endpoint

Typical steps:
1. parse body
2. validate required fields
3. normalize input (trim email)
4. call DB
5. return 201 or a clear 4xx error

## Best Practices

### 1) Validate early at the boundary

Don’t let invalid data flow deep into your app.

### 2) Normalize input

Trim strings, enforce casing rules (emails), clamp pagination values.

### 3) Use stable error responses

Clients should be able to render errors reliably.

## Common Pitfalls and Solutions

### Pitfall 1: Assuming `req.query.page` is a number

**Problem:** Query params arrive as strings.

**Solution:** Convert and validate.

### Pitfall 2: Missing JSON parsing middleware

**Problem:** `req.body` is undefined.

**Solution:** Add `app.use(express.json())` before routes.

### Pitfall 3: Trusting the client

**Problem:** You assume a field exists and crash when it doesn’t.

**Solution:** Validate presence and types; return 400 for invalid input.

## Troubleshooting

### Issue: `req.body` is always undefined

**Symptoms:**
- creates/updates fail due to missing fields

**Solutions:**
1. Add `app.use(express.json())`.
2. Ensure the client sends `Content-Type: application/json`.

### Issue: Route params don’t match

**Symptoms:**
- you hit `/users/123` but get 404

**Solutions:**
1. Confirm route path is correct (`/users/:id`).
2. Confirm router base path mounting (if using `express.Router`).

---

## Advanced Boundary Patterns (Reference)

### 1) Prefer “parse helpers” for reuse

Boundary parsing is repetitive. Centralize it so all endpoints behave consistently.

```typescript
export function parsePositiveInt(value: unknown, fallback?: number): number | null {
  const n = typeof value === "string" ? Number(value) : NaN;
  if (!Number.isInteger(n) || n <= 0) return fallback ?? null;
  return n;
}
```

Usage:

```typescript
const page = parsePositiveInt(req.query.page, 1) ?? 1;
const limit = Math.min(100, parsePositiveInt(req.query.limit, 20) ?? 20);
```

### 2) Normalize before storing or querying

Normalization reduces “same data, different spelling” bugs:
- `email.trim().toLowerCase()`
- `name.trim()`
- clamp pagination (`limit`)

### 3) Runtime validation (preview, but crucial)

TypeScript does not validate runtime input. For real safety:
- validate with a schema library (Zod is introduced in Level 05)
- store the validated data back into `req.body` (or a typed property)

### 4) Stable 400 errors for clients

Frontend forms need field-level errors. A stable shape helps:

```json
{
  "error": "Validation failed",
  "details": [
    { "path": ["email"], "message": "Invalid email" }
  ]
}
```

Even if you don’t implement this fully yet, design toward it.

### 5) Security mindset: “never trust the client”

Common “trusting input” bugs:
- allowing clients to send `role: "admin"` in create/update bodies
- trusting `userId` in the body instead of using auth context
- trusting query params to choose sensitive fields

Rule of thumb:
> Client input can request changes, but your server decides what is allowed.

## Next Steps

Now that you can handle requests reliably:

1. ✅ **Practice**: Add pagination parsing to a list endpoint
2. ✅ **Experiment**: Add input validation and return clear 400 errors
3. 📖 **Next Lesson**: Learn about [Response Formatting](./lesson-03-response-formatting.md)
4. 💻 **Complete Exercises**: Work through [Exercises 03](./exercises-03.md)

## Additional Resources

- [Express Docs: Request API](https://expressjs.com/en/api.html#req)
- [MDN: JSON](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON)

---

**Key Takeaways:**
- Treat all input as untrusted; parse + validate at the boundary.
- `req.params` and `req.query` are strings; convert and validate before use.
- TypeScript types help, but runtime validation is required for real safety.
