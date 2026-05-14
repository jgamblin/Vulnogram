# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vulnogram is a CVE (Common Vulnerabilities and Exposures) management tool with two deployment modes:
- **Solo mode**: Static frontend-only (runs in browser, stores drafts locally)
- **Team mode**: Full-stack Express.js + MongoDB with real-time collaborative editing via Socket.IO

## Common Commands

### Development
```bash
node app.js                        # Start server (default: http://localhost:3555)
NODE_ENV=development node app.js   # Development mode (no HTTPS required)
npm test                           # Start with nodemon (auto-restart on changes)
```

### Building
```bash
npm run bundle:editor              # Bundle src/js/edit/ modules into public/js/vg-editor.js
make min                           # Build standalone/solo mode (minified HTML+CSS+JS)
```

### User Management
```bash
node scripts/useradd.js <username> <email> <name> <org> <priv>
```

### Docker
```bash
docker compose up                  # Start Vulnogram + MongoDB
ENV_VAR_PATH=example.env docker compose up  # With custom env vars
```

## Architecture

### Request Flow
`app.js` → Express middleware (rate-limit, session, CSRF, passport) → dynamic route mounting from sections → Pug templates

### Section System (Plugin Architecture)
Sections live in `default/<name>/` with optional overrides in `custom/<name>/`. Each section provides:
- `conf.js` — config (title, icon, order, schema path, shortcuts)
- `*.schema.json` — JSON Schema defining the data model
- `script.js` / `preload.js` — custom validation/transformation logic
- `render.pug` / `edit.pug` / `list.pug` — custom view templates
- `style.css` / `static/` — section-specific assets

Sections are auto-discovered by `models/sections.js` and mounted as Express routes in `app.js`. Files in `custom/` override files in `default/` via config merging.

Active sections: **cve5** (main), **home** (dashboard), **nvd**, **cvss4**

### Route Factory Pattern
- `routes/doc.js` — factory function that creates CRUD + search + aggregation routes per section
- `routes/onedoc.js` — single document view/edit with history tracking
- `routes/users.js` — authentication and user management
- `routes/comments.js`, `routes/attachments.js` — per-document features

### Frontend Module System
Source modules in `src/js/edit/` are bundled by a custom bundler (`scripts/bundle-editor.js`) that:
1. Parses ES6 imports and resolves dependencies
2. Strips import/export syntax (converts to global scope)
3. Prepends vendor libs (tagify)
4. Outputs `public/js/vg-editor.js`

**After editing any file in `src/js/edit/`, run `npm run bundle:editor`** to rebuild.

Key client-side modules: `state.js` (app state), `ui.js` (DOM), `actions.js` (form handling), `realtime.js` (Socket.IO sync), `drafts.js` (local draft caching)

### Database
- MongoDB via `lib/mongo.js` (singleton connection)
- Collections per section (e.g., `cve5`) plus `<section>_histories` for audit trails (RFC 6902 JSON patches)
- User model in `models/user.js` with PBKDF2-SHA512 password hashing (`lib/pbkdf2.js`)

### Real-Time Collaboration
`lib/realtime.js` manages Socket.IO rooms per document, broadcasting JSON patches (RFC 6902) for incremental sync. Frontend counterpart: `src/js/edit/realtime.js`.

### Templates
Pug templates in `views/`. `layout.pug` is the main layout with Tailwind CSS sidebar navigation and dark mode support. Section-specific templates override via the section's own `.pug` files.

## Configuration
- `config/conf.js` — main config (DB connection, server settings, realtime options)
- `config/conf-standalone.js` — solo mode config
- `config/passport.js` — Passport.js local strategy
- `.env` file (optional, loaded via dotenv) — see `example.env` for available variables

## Security Patterns
- CSRF protection via `csurf` on all state-changing routes
- Rate limiting: 200 req/min global, 60 ops/sec realtime
- Input validation via `express-validator` and `sanitize-html`
- All passwords hashed with PBKDF2-SHA512 (100,599 iterations)
