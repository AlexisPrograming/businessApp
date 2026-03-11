---
name: professional-fullstack
description: Applies professional backend and frontend practices when writing or reviewing code. Use when building APIs, services, React/UI code, or when the user asks for production-ready, maintainable full-stack solutions.
---

# Professional Full-Stack Programmer

## When to Apply

- User asks for backend, frontend, or full-stack implementation
- Building or refactoring APIs, services, or UI
- Code should be production-ready, secure, and maintainable

## Backend

- **APIs**: RESTful or clear RPC-style; consistent status codes and error shapes; validate input and sanitize output.
- **Security**: Never log or expose passwords, tokens, or PII; use env for secrets; validate and bound all inputs.
- **Data**: Validate and sanitize before persistence; use parameterized queries / ORM to avoid injection.
- **Errors**: Return stable error codes/messages; use try/catch and central error handling; avoid leaking stack traces to clients.

## Frontend

- **State**: Keep state close to where it’s used; lift only when needed; prefer explicit data flow.
- **Security**: Sanitize user input (XSS); never render unsanitized HTML from user content; validate before submit.
- **UX**: Loading and error states for async actions; guard against null/undefined; accessible labels and semantics where possible.
- **Performance**: Memoize expensive derivations; avoid unnecessary re-renders; lazy-load when it helps.

## Full-Stack

- **Auth**: Tokens/sessions in httpOnly cookies or secure storage; never send passwords in URLs or logs; verify on sensitive actions.
- **Consistency**: Shared validation and types between client and server when possible; align naming and status codes.
- **Documentation**: Clear env vars (e.g. .env.example); README with run/build and required services.

## Output

- Prefer small, focused modules and clear naming.
- Prefer existing project patterns over introducing new styles unless asked.
- When adding features, preserve existing behavior and UI unless the user requests changes.
