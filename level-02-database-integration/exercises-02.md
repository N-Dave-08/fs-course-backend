# Exercises 02: Database Integration

## Learning Objectives

By completing these exercises, you will:
- ✅ Set up Prisma in Express application
- ✅ Create CRUD API endpoints with database
- ✅ Implement database relationships
- ✅ Handle database errors gracefully
- ✅ Use Prisma Client in Express routes
- ✅ Practice TypeScript with Prisma and Express

## Before You Start

**Prerequisites:**
- Express.js basics (Level 1)
- Prisma knowledge (from fs-course-database)
- Database connection configured
- TypeScript knowledge

**Setup:**
1. Navigate to `fs-course-backend/level-02-database-integration/`
2. Ensure Prisma is set up in `project/`
3. Database should be running and connected

**Windows note (PowerShell):**
PowerShell often aliases `curl` to `Invoke-WebRequest`. Use `curl.exe` if your curl commands behave unexpectedly.

---

## Exercise 1: Prisma Setup

**Objective:** Set up Prisma in your Express application.

**Instructions:**
1. Create Prisma schema with User model
2. Generate Prisma Client
3. Create and apply migration
4. Set up Prisma Client instance

**Step-by-Step:**

1. **Create/Update `project/prisma/schema.prisma`:**
```prisma
// project/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

2. **Generate Prisma Client:**
```bash
cd project
npx prisma generate
```

3. **Create Migration:**
```bash
npx prisma migrate dev --name create_user_model
```

4. **Create Prisma Client Instance** (`project/src/lib/prisma.ts`):
```typescript
// project/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Prevent multiple instances in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

**Verification Steps:**
1. Check Prisma Client generated: `ls node_modules/.prisma/client`
2. Verify migration applied: `npx prisma migrate status`
3. Test Prisma connection: Create a test script

**Expected Behavior:**
- Schema file created
- Prisma Client generated
- Migration applied to database
- Prisma instance available for import

**Hints:**
- Use singleton pattern for Prisma Client
- Configure logging for development
- Always generate client after schema changes

**Common Mistakes:**
- ❌ Not generating Prisma Client after schema changes
- ❌ Creating multiple Prisma instances
- ❌ Not handling connection errors

**Files:** `project/prisma/schema.prisma` and `project/src/lib/prisma.ts`

---

## Exercise 2: CRUD Operations

**Objective:** Create full CRUD API endpoints with database.

**Instructions:**
Create API endpoints in `project/src/routes/users.ts`:
1. GET /users - list all users
2. GET /users/:id - get user by id
3. POST /users - create user
4. PUT /users/:id - update user
5. DELETE /users/:id - delete user

**Expected Code Structure:**
```typescript
// project/src/routes/users.ts
import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /users - List all users
router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /users/:id - Get user by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /users - Create user
router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;

    // Validation
    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /users/:id - Update user
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const { email, name } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check email uniqueness if email is being changed
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });
      if (emailExists) {
        return res.status(409).json({ error: 'Email already exists' });
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(email && { email }),
        ...(name && { name }),
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /users/:id - Delete user
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user
    await prisma.user.delete({
      where: { id },
    });

    res.status(204).send(); // No content
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
```

**Verification Steps:**
1. Test GET /users - should return array
2. Test GET /users/:id - should return user or 404
3. Test POST /users - should create user
4. Test PUT /users/:id - should update user
5. Test DELETE /users/:id - should delete user

**Expected Behaviors:**
- All CRUD operations work
- Proper HTTP status codes
- Error handling for invalid data
- Database operations are async

**Hints:**
- Always use `await` with Prisma operations
- Handle Prisma errors (unique constraint, etc.)
- Validate input data
- Check existence before update/delete

**Common Mistakes:**
- ❌ Not awaiting Prisma operations
- ❌ Not handling database errors
- ❌ Not validating input
- ❌ Wrong HTTP status codes

**File:** `project/src/routes/users.ts`

---

## Exercise 3: Relationships

**Objective:** Add Post model with User relationship.

**Instructions:**
1. Create Post model in schema
2. Add endpoints for posts
3. Include user in post queries

**Step-by-Step:**

1. **Update `project/prisma/schema.prisma`:**
```prisma
// Add Post model
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String
  published Boolean  @default(false)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("posts")
}

// Update User model to include posts
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  posts     Post[]   // One-to-many relationship
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

2. **Create Migration:**
```bash
npx prisma migrate dev --name add_posts_model
```

3. **Create Posts Routes** (`project/src/routes/posts.ts`):
```typescript
// project/src/routes/posts.ts
import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /posts - List all posts with authors
router.get('/', async (req: Request, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET /posts/:id - Get post by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// POST /posts - Create post
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, content, published, authorId } = req.body;

    // Validation
    if (!title || !content || !authorId) {
      return res.status(400).json({ 
        error: 'Title, content, and authorId are required' 
      });
    }

    // Verify author exists
    const author = await prisma.user.findUnique({
      where: { id: authorId },
    });

    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }

    // Create post
    const post = await prisma.post.create({
      data: {
        title,
        content,
        published: published || false,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

export default router;
```

4. **Update Server** (`project/src/server.ts`):
```typescript
// Add posts routes
import postsRouter from './routes/posts';

app.use('/api/posts', postsRouter);
```

**Verification Steps:**
1. Create a user first
2. Create a post with that user's ID
3. Get posts - should include author information
4. Verify relationship works both ways

**Expected Behavior:**
- Posts include author information
- Can query user's posts
- Relationship is properly set up
- Foreign key constraints work

**Hints:**
- Use `include` to fetch related data
- Use `select` to limit fields
- Verify foreign key exists before creating
- Relationships work both ways

**Common Mistakes:**
- ❌ Not including related data in queries
- ❌ Not verifying foreign key exists
- ❌ Wrong relationship definition in schema

**Files:** Update `project/prisma/schema.prisma` and create `project/src/routes/posts.ts`

---

## Running Exercises

### Start Server

```bash
cd project
pnpm dev
```

### Test Endpoints

**Users:**
```bash
# Create user
curl.exe -X POST http://localhost:3001/api/users -H "Content-Type: application/json" -d "{\"name\":\"Alice\",\"email\":\"alice@example.com\"}"

# Get all users
curl.exe http://localhost:3001/api/users

# Get user by ID
curl.exe http://localhost:3001/api/users/1

# Update user
curl.exe -X PUT http://localhost:3001/api/users/1 -H "Content-Type: application/json" -d "{\"name\":\"Alice Updated\"}"

# Delete user
curl.exe -X DELETE http://localhost:3001/api/users/1
```

**Posts:**
```bash
# Create post
curl.exe -X POST http://localhost:3001/api/posts -H "Content-Type: application/json" -d "{\"title\":\"My Post\",\"content\":\"Post content\",\"authorId\":1}"

# Get all posts
curl.exe http://localhost:3001/api/posts
```

## Verification Checklist

After completing all exercises, verify:

- [ ] Prisma Client is set up correctly
- [ ] All CRUD operations work
- [ ] Database relationships work
- [ ] Error handling is proper
- [ ] Input validation works
- [ ] HTTP status codes are correct
- [ ] Can query related data
- [ ] No TypeScript errors

## Troubleshooting

### Issue: "Prisma Client not generated"

**Solution:**
```bash
cd project
npx prisma generate
```

### Issue: Database connection errors

**Solution:**
- Check DATABASE_URL in `.env`
- Verify database is running
- Test connection: `npx prisma db pull`

### Issue: Foreign key constraint errors

**Solution:**
- Verify related record exists
- Check relationship definition in schema
- Ensure IDs are valid

## Next Steps

1. ✅ **Review**: Understand Prisma with Express
2. ✅ **Experiment**: Add more relationships
3. 📖 **Continue**: Move to [Level 3: API Development](../level-03-api-development/lesson-01-restful-apis.md)
4. 💻 **Reference**: Check `project/` folder

---

**Key Takeaways:**
- Prisma Client provides type-safe database access
- Always await Prisma operations
- Handle database errors gracefully
- Use include/select for related data
- Validate input before database operations
- Use proper HTTP status codes

**Good luck! Happy coding! 🚀**
