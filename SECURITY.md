# Security Policy

## Supported Versions

| version | supported |
|---|---|
| latest | ✅ |
| older | ❌ |

## Reporting a Vulnerability

**DO NOT** open a public GitHub issue for security vulnerabilities.

email: **security@nurovia.ai** (or whatever address the maintainer uses)

include:
- description of the vulnerability
- steps to reproduce
- impact assessment
- any known mitigations

you should get a response within 48 hours. we'll work with you on a fix and disclosure timeline.

## Security Architecture

- **passwords** — PBKDF2-SHA-256, 100k iterations, 16-byte salt
- **sessions** — httpOnly + Secure + SameSite=Lax cookie, 30-day TTL, signed via Lucia
- **rate limiting** — 3 signups/hr, 5 signins/15min, 3 forgot/hr (per IP)
- **account lockout** — 10 failed signins → 15min lock
- **API keys** — AES-256-GCM at rest, never returned to client
- **CSP** — strict, set via security headers middleware
- **CORS** — explicit allowlist (your configured `FRONTEND_URL`)

see [DEPLOY.md](./DEPLOY.md) for production deployment hardening.
