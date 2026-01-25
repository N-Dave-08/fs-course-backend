# Lesson 1: JWT Authentication

## Learning Objectives

By the end of this lesson, you will be able to:
- Explain what JWTs are and what “stateless auth” means
- Generate JWTs securely with correct claims and expiration
- Verify JWTs and attach auth context to requests via middleware
- Understand common security pitfalls (weak secrets, long expirations, trusting decoded payload blindly)
- Distinguish authentication (who you are) from authorization (what you can do)

## Why JWT Authentication Matters

JWTs (JSON Web Tokens) are a common way to authenticate API requests when:
- you have multiple clients (web, mobile)
- you want stateless auth (no server session store required)

But JWTs come with trade-offs and require careful implementation.

```mermaid
flowchart LR
  login[Login] --> issue[IssueJWT]
  issue --> client[ClientStoresToken]
  client --> request[RequestWithBearerToken]
  request --> middleware[AuthMiddleware]
  middleware --> route[ProtectedRoute]
```

## JWT Basics (Practical)

A JWT typically includes:
- a header (algorithm, token type)
- a payload (claims like `userId`, `role`, `exp`)
- a signature (proves integrity)

JWTs are **not encrypted by default**. Anyone who has the token can read the payload. Don’t store secrets in it.

## Generating Tokens

```typescript
import jwt from "jsonwebtoken";

const token = jwt.sign(
  { userId: user.id },
  process.env.JWT_SECRET!,
  { expiresIn: "7d" }
);
```

### What to include in payload

Include minimal, stable claims:
- `userId`
- maybe `role` (if it rarely changes)

Avoid putting large user objects in tokens.

### Expiration

Shorter expirations reduce risk if a token is stolen, but can require refresh strategies.

## Verifying Tokens

```typescript
const decoded = jwt.verify(token, process.env.JWT_SECRET!);
```

### Important: treat decoded as untrusted until typed

`jwt.verify` returns `string | object` depending on token. You should validate/shape-check it before using fields.

## Auth Middleware (Bearer Token)

This middleware:
- reads `Authorization: Bearer <token>`
- verifies it
- attaches decoded claims to the request

```typescript
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

type JwtPayload = { userId: number; role?: string };

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    if (typeof decoded !== "object" || decoded === null || !("userId" in decoded)) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Attach minimal auth context (you can also look up the full user in DB)
    (req as any).user = decoded as JwtPayload;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
```

## Real-World Scenario: “Who am I?” Endpoint

Common pattern:
- client stores token
- client calls `/me` with bearer token
- backend verifies token and returns current user profile

This keeps tokens small but still lets UI fetch fresh user data.

## Best Practices

### 1) Use a strong secret and rotate carefully

JWT secret must be long, random, and stored securely (env var / secret manager).

### 2) Keep JWT payload minimal

Tokens are readable; store IDs/claims, not sensitive data.

### 3) Validate auth on every protected request

JWT-based auth is only “stateless” if you verify each request.

## Common Pitfalls and Solutions

### Pitfall 1: No expiration (or extremely long expiration)

**Problem:** Stolen tokens remain valid for too long.

**Solution:** Use `expiresIn`, and consider refresh strategies for long-lived sessions.

### Pitfall 2: Trusting the decoded payload blindly

**Problem:** You assume decoded has fields; runtime errors happen or logic is bypassed.

**Solution:** Validate shape (or use a schema validator) and attach minimal typed context.

### Pitfall 3: Putting secrets in JWT payload

**Problem:** Anyone can base64-decode the payload.

**Solution:** Never store secrets; use server-side lookup for sensitive data.

## Troubleshooting

### Issue: Every request returns 401

**Symptoms:**
- token is missing or fails verification

**Solutions:**
1. Confirm client sends `Authorization: Bearer <token>`.
2. Confirm `JWT_SECRET` matches between issuing and verifying.
3. Confirm token hasn’t expired.

### Issue: Middleware sets user but downstream code can’t read it

**Symptoms:**
- `req.user` is undefined in handlers

**Solutions:**
1. Ensure middleware runs before protected routes (`app.use(authenticate)` or per-route usage).
2. Add proper request typing (advanced; can extend Express `Request` type).

## Next Steps

Now that you can authenticate requests:

1. ✅ **Practice**: Add login endpoint that returns a JWT
2. ✅ **Experiment**: Create a `/me` endpoint protected by `authenticate`
3. 📖 **Next Lesson**: Learn about [Password Hashing](./lesson-02-password-hashing.md)
4. 💻 **Complete Exercises**: Work through [Exercises 04](./exercises-04.md)

## Additional Resources

- [jsonwebtoken docs](https://github.com/auth0/node-jsonwebtoken)
- [OWASP: JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)

---

**Key Takeaways:**
- JWTs are a common stateless auth mechanism for APIs.
- Generate tokens with strong secrets and reasonable expirations.
- Verify tokens on every request and validate decoded payload shape.
- Keep payload minimal; don’t store secrets in JWTs.
