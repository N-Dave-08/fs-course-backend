# Lesson 2: Password Hashing

## Learning Objectives

By the end of this lesson, you will be able to:
- Explain why passwords must be hashed (never stored in plaintext)
- Hash passwords securely using bcrypt (or equivalent)
- Verify passwords during login
- Design registration flows that avoid leaking sensitive data
- Recognize common pitfalls (low cost factors, timing issues, returning hashes)

## Why Password Hashing Matters

If your database is ever leaked, plaintext passwords are catastrophic.

Hashing (with a strong password hashing algorithm) ensures:
- the original password is not stored
- attackers must spend significant compute to guess passwords

```mermaid
flowchart LR
  password[PlainPassword] --> hash[HashFunction(bcrypt)]
  hash --> stored[StoreHashInDB]
  login[LoginAttempt] --> compare[ComparePasswordToHash]
  compare --> ok{Match?}
  ok -->|yes| auth[AuthenticateUser]
  ok -->|no| deny[Deny]
```

## Hashing Passwords (bcrypt)

```typescript
import bcrypt from "bcrypt";

const saltRounds = 10;
const hashedPassword = await bcrypt.hash(password, saltRounds);
```

### Cost factor note

Higher cost = slower hash = harder to brute force, but also more CPU on your server.
Choose a cost based on your environment and performance requirements.

## Verifying Passwords

```typescript
const isValid = await bcrypt.compare(password, hashedPassword);
```

Never compare hashes manually (string comparisons); use the library’s compare function.

## User Registration (Example)

```typescript
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  // Validate input (covered later in validation lessons)
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, passwordHash: hashedPassword },
  });

  // Never return the hash to the client
  return res.status(201).json({ user: { id: user.id, email: user.email } });
});
```

### Naming recommendation

Store hashes in a field named `passwordHash`, not `password`, to avoid confusion and accidents.

## Real-World Scenario: Login Flow

Login typically:
1. fetch user by email
2. compare password with stored hash
3. if valid, issue session/JWT

Never reveal whether the email exists (“user not found”) vs password incorrect in a way that helps attackers enumerate accounts.

## Best Practices

### 1) Never store plaintext passwords

Always store `passwordHash` (and possibly password reset tokens separately).

### 2) Don’t return password hashes

Even though hashes aren’t plaintext, they are still sensitive.

### 3) Validate passwords at registration

Enforce minimum length and basic complexity rules (and consider rate limiting).

## Common Pitfalls and Solutions

### Pitfall 1: Too-low bcrypt cost

**Problem:** Hashing is too fast, making brute force easier.

**Solution:** Choose a reasonable cost and benchmark your environment.

### Pitfall 2: Leaking auth details in error messages

**Problem:** Different errors reveal if a user exists.

**Solution:** Use generic login errors like “Invalid credentials”.

### Pitfall 3: Returning `user` object with hash included

**Problem:** You accidentally return all fields.

**Solution:** Use `select` or explicit response DTOs.

## Troubleshooting

### Issue: Login is very slow

**Symptoms:**
- high CPU, slow responses under load

**Solutions:**
1. Benchmark bcrypt cost factor and tune.
2. Add rate limiting to login endpoints.
3. Scale horizontally if needed.

### Issue: Password compare always fails

**Symptoms:**
- valid credentials never work

**Solutions:**
1. Confirm you’re hashing the original password at registration.
2. Confirm you’re comparing the raw password to the stored hash (not hashing again manually).

## Next Steps

Now that you can hash passwords safely:

1. ✅ **Practice**: Implement register + login with bcrypt and Prisma
2. ✅ **Experiment**: Add password length validation and return 400 on weak passwords
3. 📖 **Next Lesson**: Learn about [Authorization](./lesson-03-authorization.md)
4. 💻 **Complete Exercises**: Work through [Exercises 04](./exercises-04.md)

## Additional Resources

- [bcrypt npm](https://www.npmjs.com/package/bcrypt)
- [OWASP: Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

---

**Key Takeaways:**
- Hash passwords with a slow hashing algorithm (bcrypt) and store only the hash.
- Verify passwords with `bcrypt.compare`, not manual comparison.
- Never return password hashes in API responses.
- Validate inputs and avoid leaking account existence via error messages.
