# Full Stack Course: Backend

Build robust REST APIs with Express.js, TypeScript, and Prisma.

## Overview

This course teaches you how to build production-ready backend APIs using Express.js 4.21+, TypeScript 5.7+, and Prisma 7.3.0+. You'll learn routing, middleware, authentication, validation, error handling, and database integration.

## Prerequisites

**IMPORTANT**: Complete [fs-course-typescript](../fs-course-typescript/) first.

- TypeScript fundamentals (from fs-course-typescript)
- Node.js 22+ LTS
- pnpm package manager
- Basic understanding of HTTP and REST APIs

## Course Structure

This course consists of **6 progressive levels**:

1. **Level 1: Express Basics** - Introduction, routing, middleware
2. **Level 2: Database Integration** - Prisma setup, queries, relationships
3. **Level 3: API Development** - RESTful APIs, request handling, response formatting
4. **Level 4: Authentication & Security** - JWT authentication, password hashing, authorization
5. **Level 5: Validation & Error Handling** - Input validation, error middleware, error responses
6. **Level 6: Advanced Topics** - File uploads, rate limiting, logging

## Getting Started

1. **Read the Setup Guide**: Start with [LEARNING-GUIDE.md](./LEARNING-GUIDE.md)
2. **Follow Setup Instructions**: Install dependencies and configure your environment
3. **Start Learning**: Begin with Level 1 and progress sequentially
4. **Explore Project**: Check the `project/` folder for a complete reference implementation

## Tech Stack

- **Express.js**: 4.21+ (web framework)
- **TypeScript**: 5.7+ (type safety)
- **Prisma**: 7.3.0+ (ORM)
- **Node.js**: 22+ LTS
- **Package Manager**: pnpm

## Related Courses

- **fs-course-database** - Deep dive into database concepts
- **fs-course-frontend** - Build the frontend that consumes this API
- **fs-course-testing** - Test your backend APIs

## Integration

This backend is designed to work with:
- **Frontend** from `fs-course-frontend` (serves API endpoints)
- **Database** from `fs-course-database` (uses Prisma schemas)
- **Caching** from `fs-course-caching` (integrates Redis)
- **Error tracking** from `fs-course-error-tracking` (uses Winston and Sentry)
- **Infrastructure** from `fs-course-infrastructure` (containerized deployment)

### Environment Variables

Configure in `.env`:

```env
# Database (from fs-course-database)
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb

# Redis (from fs-course-caching)
REDIS_URL=redis://localhost:6379

# Error tracking (from fs-course-error-tracking)
SENTRY_DSN=your-sentry-dsn

# JWT
JWT_SECRET=your-secret-key
```

### Connecting Services

1. **Database**: Use Prisma from `fs-course-database` project
2. **Caching**: Integrate Redis client from `fs-course-caching`
3. **Error Tracking**: Add Winston/Sentry from `fs-course-error-tracking`
4. **Frontend**: CORS configured for `fs-course-frontend` origin

### API Endpoints

This backend provides REST API endpoints consumed by:
- `fs-course-frontend` - Frontend makes requests to these endpoints
- `fs-course-testing` - Test suite validates these endpoints

### Full Stack Flow

```text
Frontend → Backend API → Database
              ↓
          Redis Cache
              ↓
      Error Tracking (Sentry)
```
