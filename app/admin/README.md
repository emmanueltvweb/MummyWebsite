# Admin Dashboard

The admin console lives at `/admin`. It manages the blog, homepage slider, pages, media, comments, newsletter and site settings.

## First sign-in

On first start, if `data/users.json` doesn't exist, one **Super Admin** account is created:

- From `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` (and optional `ADMIN_SEED_NAME`) if they're set, **or**
- `admin@example.com` / `password123` otherwise. The dashboard shows a warning until the password is changed under **My profile**.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `ADMIN_SESSION_SECRET` | **Yes in production** (32+ chars) | Signs the session cookie. A dev-only fallback is used locally. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Yes | All media is stored on Cloudinary. |
| `CLOUDINARY_UPLOAD_FOLDER` | No | Root folder for uploads (default `website-uploads`). |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Absolute site URL for newsletter links, tracking and SEO metadata. |
| `RESEND_API_KEY` | For real emails | Without it, emails are logged instead of sent. |
| `NEWSLETTER_FROM_EMAIL` | No | Sender address for campaigns (default `noreply@scoanlegacy.org`). |
| `ADMIN_EMAIL` | No | Receives "new subscriber" notifications. |
| `LOG_LEVEL` | No | `debug` \| `info` \| `warn` \| `error`. |
| `ADMIN_IDLE_TIMEOUT_MINUTES` | No | Inactivity limit for sessions without "Remember me" (default 60, minimum 5). |

## Sign-in & sessions

- **Remember me** keeps you signed in for 30 days. Without it, the session ends when the browser closes, after 12 hours at most, or after the inactivity limit (default 60 minutes). A countdown warning appears 60 seconds before an inactivity sign-out, and activity in any open tab counts.
- Every sign-in is a server-side session that can be revoked. **My profile → Active sessions** lists your devices and can sign any of them out.
- Suspending a user, resetting their password, or changing your own password signs out the affected sessions immediately.

## Roles & permissions (RBAC)

Permissions are `module.action` pairs (see `lib/cms/rbac.ts`) for Dashboard, Analytics, Blog, Categories, Media, Comments, Email Subscribers, Newsletter, Pages & Website, Users and Settings. A role is a list of permissions, and changes apply instantly.

| Role | Default access |
| --- | --- |
| **Super Admin** | Everything. Locked, and there is always at least one active Super Admin. |
| **Admin** | Everything except creating or changing users and roles (can view them). |
| **Editor** | All content: blog (including publishing), categories, media, comments, pages, slider, website content and newsletter. |
| **Author** | Writes and edits their own drafts and uploads media. Can't publish or delete. |
| **Moderator** | Views posts and moderates comments. |

The Super Admin can create, edit, suspend, reactivate and delete users, reset passwords (a one-time temporary password), sign users out of every device, assign roles, edit any role's permissions under **Roles & Permissions**, and create or delete custom roles. Accounts from the old admin/editor/contributor roles are migrated automatically, and the first administrator becomes Super Admin.

## Architecture

- **Auth**: signed, HTTP-only session cookie (`lib/server/session-token.ts`) tied to a server-side session (`data/sessions.json`). `proxy.ts` guards `/admin/*` and `/api/admin/*`. Every admin API re-checks the session, user and permission via `route({ permission })` in `lib/server/api.ts`. Roles live in `data/roles.json`.
- **Storage**: JSON documents in `data/` via `lib/server/db.ts` (serialised, atomic writes). Swap that module for a database adapter to scale beyond a single server. Files holding personal data (`users`, `subscribers`, `comments`, `campaigns`, `audit-log`, `notifications`) are git-ignored. **Serverless hosts such as Vercel do not persist local files**, so run on a Node server with a persistent disk, or replace the adapter first.
- **Media**: the browser uploads straight to Cloudinary using a short-lived signature from `/api/admin/cloudinary/sign`, which gives real progress bars and avoids request-size limits. Only Cloudinary URLs are accepted in posts, pages, slides and settings. Images are delivered with `f_auto,q_auto` (`lib/cloudinary/optimize.ts`).
- **Content safety**: rich text is sanitised on save and again on render (`lib/cms/html.ts`).
- **Scheduling**: scheduled posts go live automatically the first time posts are read after their publish time. No cron job is needed.
- **Validation / errors / rate limits / logging**: zod schemas (`lib/cms/schemas.ts`), consistent `{ success, data | error }` responses, in-memory rate limiting (`lib/server/rate-limit.ts`), structured JSON logs (`lib/server/logger.ts`) and a health check at `/api/health`.

## Keyboard shortcuts

`Ctrl K` search · `?` shortcut help · `Ctrl S` save · `Ctrl B` collapse sidebar · `g` then `d`/`p`/`n`/`c`/`m`/`s`/`e` to jump between sections.
