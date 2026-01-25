# Backend Best Practices

## Security

- Always hash passwords
- Use HTTPS in production
- Validate all inputs
- Use environment variables for secrets
- Implement rate limiting

## Error Handling

- Use consistent error format
- Log errors properly
- Don't expose internal errors to clients
- Return appropriate status codes

## Code Organization

```text
src/
├── routes/      # Route definitions
├── controllers/ # Request handlers
├── services/    # Business logic
├── middleware/  # Middleware functions
├── types/       # TypeScript types
└── utils/       # Utility functions
```

## Database

- Use Prisma for type safety
- Always validate data before saving
- Use transactions for multiple operations
- Handle database errors gracefully
