# Exercises 03: API Development

## Learning Objectives

By completing these exercises, you will:
- ✅ Create complete RESTful APIs
- ✅ Implement request validation
- ✅ Add pagination to API endpoints
- ✅ Use proper HTTP status codes
- ✅ Create consistent response formats
- ✅ Handle errors gracefully

## Before You Start

**Prerequisites:**
- Express.js basics (Level 1)
- Database integration (Level 2)
- Understanding of REST principles
- TypeScript knowledge

**Setup:**
1. Navigate to `fs-course-backend/level-03-api-development/`
2. Ensure Express and Prisma are set up
3. All exercises should be created in `project/src/`

**Windows note (PowerShell):**
PowerShell often aliases `curl` to `Invoke-WebRequest`. Use `curl.exe` if your curl commands behave unexpectedly.

---

## Exercise 1: RESTful Endpoints

**Objective:** Create a complete REST API for a resource with all CRUD operations.

**Instructions:**
Create `project/src/routes/articles.ts` that implements:
1. GET /articles - List all articles
2. GET /articles/:id - Get article by ID
3. POST /articles - Create article
4. PUT /articles/:id - Update article
5. DELETE /articles/:id - Delete article

**Step-by-Step:**

1. **Update Prisma Schema** (if needed):
```prisma
model Article {
  id        Int      @id @default(autoincrement())
  title     String
  content   String
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("articles")
}
```

2. **Create Routes** (`project/src/routes/articles.ts`):
```typescript
// project/src/routes/articles.ts
import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Consistent response format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// GET /articles - List all
router.get('/', async (req: Request, res: Response) => {
  try {
    const articles = await prisma.article.findMany({
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

    const response: ApiResponse<typeof articles> = {
      success: true,
      data: articles,
    };
    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch articles',
    };
    res.status(500).json(response);
  }
});

// GET /articles/:id - Get by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid article ID',
      };
      return res.status(400).json(response);
    }

    const article = await prisma.article.findUnique({
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

    if (!article) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Article not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof article> = {
      success: true,
      data: article,
    };
    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch article',
    };
    res.status(500).json(response);
  }
});

// POST /articles - Create
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, content, authorId, published } = req.body;

    if (!title || !content || !authorId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Title, content, and authorId are required',
      };
      return res.status(400).json(response);
    }

    const article = await prisma.article.create({
      data: {
        title,
        content,
        authorId,
        published: published || false,
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

    const response: ApiResponse<typeof article> = {
      success: true,
      data: article,
      message: 'Article created successfully',
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to create article',
    };
    res.status(500).json(response);
  }
});

// PUT /articles/:id - Update
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid article ID',
      };
      return res.status(400).json(response);
    }

    const { title, content, published } = req.body;

    const article = await prisma.article.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(published !== undefined && { published }),
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

    const response: ApiResponse<typeof article> = {
      success: true,
      data: article,
      message: 'Article updated successfully',
    };
    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Article not found or update failed',
    };
    res.status(404).json(response);
  }
});

// DELETE /articles/:id - Delete
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid article ID',
      };
      return res.status(400).json(response);
    }

    await prisma.article.delete({
      where: { id },
    });

    const response: ApiResponse<null> = {
      success: true,
      message: 'Article deleted successfully',
    };
    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Article not found or delete failed',
    };
    res.status(404).json(response);
  }
});

export default router;
```

**Verification Steps:**
1. Test all endpoints
2. Verify consistent response format
3. Check HTTP status codes
4. Test error cases

**Expected Response Format:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**File:** `project/src/routes/articles.ts`

---

## Exercise 2: Request Validation

**Objective:** Add request validation middleware.

**Instructions:**
Create `project/src/middleware/validation.ts` that:
1. Validates required fields
2. Validates data types
3. Returns proper error messages

**Expected Code Structure:**
```typescript
// project/src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';

interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email';
  minLength?: number;
  maxLength?: number;
}

export function validate(rules: ValidationRule[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = req.body[rule.field];

      // Check required
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.field} is required`);
        continue;
      }

      // Skip further validation if field is optional and not provided
      if (!rule.required && (value === undefined || value === null)) {
        continue;
      }

      // Check type
      if (rule.type) {
        if (rule.type === 'string' && typeof value !== 'string') {
          errors.push(`${rule.field} must be a string`);
        } else if (rule.type === 'number' && typeof value !== 'number') {
          errors.push(`${rule.field} must be a number`);
        } else if (rule.type === 'boolean' && typeof value !== 'boolean') {
          errors.push(`${rule.field} must be a boolean`);
        } else if (rule.type === 'email' && typeof value === 'string') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push(`${rule.field} must be a valid email`);
          }
        }
      }

      // Check string length
      if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`${rule.field} must be at least ${rule.minLength} characters`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${rule.field} must be at most ${rule.maxLength} characters`);
        }
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors,
      });
      return;
    }

    next();
  };
}

// Usage example in routes
import { validate } from '../middleware/validation';

router.post(
  '/',
  validate([
    { field: 'title', required: true, type: 'string', minLength: 3, maxLength: 200 },
    { field: 'content', required: true, type: 'string', minLength: 10 },
    { field: 'authorId', required: true, type: 'number' },
    { field: 'published', type: 'boolean' },
  ]),
  async (req, res) => {
    // Handler code
  }
);
```

**Verification Steps:**
1. Test with missing required fields
2. Test with wrong data types
3. Test with invalid email format
4. Test with length violations

**Expected Behavior:**
- Validation errors returned clearly
- Proper HTTP status (400)
- All errors listed
- Valid requests proceed

**File:** `project/src/middleware/validation.ts`

---

## Exercise 3: Pagination

**Objective:** Implement pagination for list endpoints.

**Instructions:**
Add pagination to `project/src/controllers/users.ts`:
1. Accept `page` and `limit` query params
2. Return paginated results
3. Include total count and pagination metadata

**Expected Code Structure:**
```typescript
// project/src/controllers/users.ts
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    // Parse query parameters
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    // Validate pagination params
    if (page < 1 || limit < 1 || limit > 100) {
      res.status(400).json({
        success: false,
        error: 'Invalid pagination parameters',
      });
      return;
    }

    // Get total count and data
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponse<typeof users> = {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    res.status(200).json({
      success: true,
      ...response,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
}
```

**Usage in Route:**
```typescript
import { getUsers } from '../controllers/users';

router.get('/', getUsers);
```

**Test Pagination:**
```bash
# First page, 10 items
curl.exe "http://localhost:3001/api/users?page=1&limit=10"

# Second page
curl.exe "http://localhost:3001/api/users?page=2&limit=10"

# Custom limit
curl.exe "http://localhost:3001/api/users?page=1&limit=5"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Verification Steps:**
1. Test with different page numbers
2. Test with different limits
3. Verify pagination metadata
4. Test edge cases (page 0, negative, etc.)

**Hints:**
- Use `skip` and `take` for pagination
- Calculate `skip = (page - 1) * limit`
- Get total count for metadata
- Validate pagination parameters

**Common Mistakes:**
- ❌ Not validating page/limit
- ❌ Wrong skip calculation
- ❌ Not including pagination metadata
- ❌ Not handling edge cases

**File:** `project/src/controllers/users.ts`

---

## Running Exercises

### Start Server

```bash
cd project
pnpm dev
```

### Test Endpoints

**Articles API:**
```bash
# Create article
curl.exe -X POST http://localhost:3001/api/articles -H "Content-Type: application/json" -d "{\"title\":\"My Article\",\"content\":\"Article content\",\"authorId\":1}"

# Get all articles
curl.exe http://localhost:3001/api/articles

# Get article by ID
curl.exe http://localhost:3001/api/articles/1

# Update article
curl.exe -X PUT http://localhost:3001/api/articles/1 -H "Content-Type: application/json" -d "{\"title\":\"Updated Title\"}"

# Delete article
curl.exe -X DELETE http://localhost:3001/api/articles/1
```

**Pagination:**
```bash
# First page
curl.exe "http://localhost:3001/api/users?page=1&limit=10"

# Second page
curl.exe "http://localhost:3001/api/users?page=2&limit=10"
```

## Verification Checklist

After completing all exercises, verify:

- [ ] All REST endpoints work
- [ ] Consistent response format
- [ ] Proper HTTP status codes
- [ ] Validation middleware works
- [ ] Pagination works correctly
- [ ] Error handling is proper
- [ ] All code is type-safe

## Troubleshooting

### Issue: Validation not working

**Solution:**
- Check middleware is applied before route handler
- Verify validation rules are correct
- Check request body format

### Issue: Pagination returns wrong results

**Solution:**
- Verify skip calculation
- Check limit is applied
- Ensure total count is correct

## Next Steps

1. ✅ **Review**: Understand REST and validation
2. ✅ **Experiment**: Add more validation rules
3. 📖 **Continue**: Move to [Level 4: Authentication & Security](../level-04-authentication-security/lesson-01-jwt-authentication.md)
4. 💻 **Reference**: Check `project/` folder

---

**Key Takeaways:**
- REST APIs use standard HTTP methods
- Consistent response format improves API usability
- Validation prevents invalid data
- Pagination improves performance
- Proper status codes communicate clearly
- Always validate input

**Good luck! Happy coding! 🚀**
