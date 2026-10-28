<h1 align="center">SEO Backlinks Tracker</h1>

<p align="center"><strong>Find directories. Track outreach. Keep live backlinks accountable.</strong><br>A clean, local-first workspace for organizing off-page SEO submissions—without losing progress in spreadsheets.</p>

<p align="center">
  <a href="https://github.com/ismailgito/SEO-Backlinks-Tracker"><img alt="Next.js 14" src="https://img.shields.io/badge/Next.js-14-111111?style=flat-square&logo=next.js"></a>
  <a href="https://github.com/ismailgito/SEO-Backlinks-Tracker"><img alt="React 18" src="https://img.shields.io/badge/React-18-149eca?style=flat-square&logo=react"></a>
  <a href="data/backlinks.json"><img alt="192 catalog records" src="https://img.shields.io/badge/catalog-192%20records-0B6B4F?style=flat-square"></a>
  <a href="https://github.com/ismailgito/SEO-Backlinks-Tracker/commits/main"><img alt="Latest commit" src="https://img.shields.io/github/last-commit/ismailgito/SEO-Backlinks-Tracker?style=flat-square"></a>
</p>

<p align="center">
  <img src="docs/assets/backlinks-product-tour.gif" alt="Animated product tour: browse backlink directories, mark a source secured, and review campaign analytics" width="960">
</p>

<p align="center"><sub>Illustrative product tour. The animation uses sample campaign activity; it is not live account data.</sub></p>

## At a glance

The app combines a curated directory catalog with a practical submission workflow. Search and filter potential sources, record outreach progress, save live-link details, and review campaign activity in one dashboard.

| Bundled catalog | Count |
| --- | ---: |
| Directory records | **192** |
| Labeled dofollow | **95** |
| Labeled nofollow | **40** |
| Follow status unverified | **57** |
| Sources in the DR 90+ band | **18** |
| Domain Rating bands | **10** |
| Categories | **19** |

Counts are calculated from [`data/backlinks.json`](data/backlinks.json). Follow and DR labels are catalog metadata, not a guarantee of current link attributes or SEO results; verify a source before submitting.

## What you can do

- **Explore the catalog:** search by source, domain, or category; filter by DR band, follow label, category, and workflow status.
- **Manage outreach:** move a source through `Unsubmitted`, `On Progress`, `Submitted`, `Secured`, `Rejected`, or `Unable`.
- **Keep the details:** record a live URL and notes, and review status changes with timestamps.
- **Measure activity:** use the dashboard for submission outcomes, secured links by DR band, recent activity, and CSV export.
- **Separate campaigns:** manage multiple websites/projects without mixing their local submission records.
- **Start without credentials:** local mode stores projects and submissions in the browser. Guest sessions are limited to five secured backlinks; signed-in users are exempt from that cap.

## How the workflow fits together

1. **Find a source** using search and filters.
2. **Open its direct submission link**, when one is listed, and complete the listing on that site.
3. **Update the status** and save any notes or live URL in the tracker.
4. **Review campaign progress** in analytics or export the catalog as CSV.

## Quick start

### Requirements

- Node.js **22 or later** (required by `@supabase/supabase-js`; see `engines` in `package.json`)
- npm

### Run locally

```bash
git clone https://github.com/ismailgito/SEO-Backlinks-Tracker.git
cd SEO-Backlinks-Tracker
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No environment variables are needed for local-first mode.

### Production build

```bash
npm run build
npm start
```

## Storage and optional services

### Local-first mode (default)

With Supabase variables left blank, project settings, submission statuses, notes, live URLs, and activity are saved in the current browser's `localStorage`. This mode does **not** sync tracking data between browsers or devices; clearing browser storage removes the local records.

### Optional Supabase authentication and email

For OTP authentication and email delivery:

1. Create a Supabase project and copy [`.env.example`](.env.example) to `.env.local`.
2. Run the SQL files under [`supabase/migrations/`](supabase/migrations/) in timestamp order (init, OTP codes, legacy cleanup, OTP hardening, schema hardening).
3. Optionally run [`supabase/seed.sql`](supabase/seed.sql) to seed the directory catalog.
4. Add your Supabase values and configure **either** Gmail SMTP or Resend in `.env.local`.

#### Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project (browser + server) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only: OTP storage and account creation. Never expose it to the client |
| `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` | SMTP delivery (Gmail by default; port 465 uses TLS, other ports STARTTLS) |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Resend delivery, used when SMTP is not configured |
| `OTP_HMAC_SECRET` | Optional secret for hashing OTP codes (defaults to the service-role key) |
| `NEXT_PUBLIC_APP_URL` | Public site URL: password-reset links, canonical URL, sitemap |
| `NEXT_PUBLIC_FREE_TIER_SECURED_LIMIT` | Secured links a guest may track in total (default 5) |

In production an email transport **must** be configured: without one the OTP endpoint returns an error instead of simulating delivery.

The prepared Supabase schema does not currently make project and backlink-submission records sync across devices; tracker data remains browser-local. Never commit `.env.local` or expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code.

## Project structure

```text
app/                    Next.js app, page, styles, robots/sitemap
app/api/auth/           OTP request (otp), OTP verify + session (verify), password reset (forgot)
app/auth/               OAuth callback and password-reset link confirmation
app/reset-password/     New-password page
components/             Catalog, filters, dashboard, workflow UI, modals (useModal hook)
data/backlinks.json     Bundled directory catalog
lib/storage.js          Browser persistence (per owner), limits, activity, CSV export
lib/otp-store.js        OTP codes: Supabase RPC store with attempt/rate limits
lib/rate-limit.js       Small in-memory fixed-window limiter + client IP helper
lib/resend.js           SMTP/Resend delivery
lib/email/              Email templates
lib/supabase/           Supabase client helpers
scripts/                Seed generator and README animation renderer
supabase/migrations/    Optional database/auth SQL
supabase/seed.sql       Catalog seed data
```

The README animation is authored in [`docs/readme-preview.html`](docs/readme-preview.html) and rendered to [`docs/assets/backlinks-product-tour.gif`](docs/assets/backlinks-product-tour.gif) with [`scripts/render-readme-preview.py`](scripts/render-readme-preview.py).

## Tech stack

- [Next.js 14](https://nextjs.org/) and React 18
- Tailwind CSS 3
- Browser `localStorage` for local-first project and submission state
- Optional Supabase authentication/schema and SMTP or Resend email delivery

## 🏠 Landing Page & Creator Profile

The site opens on a landing page with two calls to action: **Sign up for free** (becomes **Open Dashboard** once signed in) and **Explore Backlinks**, which switches to the directories catalog and analytics. The logo and the browser Back button return to the landing page. Animations are CSS-only and switch off for visitors who prefer reduced motion.

To fill in the "Built by" section, edit **`lib/creator.js`** (name, role, bio, links). For the profile picture, put a square image in `/public` (e.g. `public/creator.jpg`) and set `avatar: '/creator.jpg'`.

---

## 🔐 Two-step Sign-in

Sign In → enter email + password → `POST /api/auth/signin` checks the password **on the server**, discards the session Supabase returns, and emails a 6-digit code → enter the code → `POST /api/auth/verify` (`purpose: "signin"`) issues the real session. A correct password alone never signs anyone in.

- Codes are bound to their purpose: a **signup** code can't be used to sign in, and signing up with an email that already has an account is refused instead of logging in.
- Password guesses are throttled (8 per account and 30 per IP per 10 minutes), and wrong codes lock after 5 tries (10 per hour per email).
- Known limits: the second step is enforced by this app's routes, not by Supabase itself, and **Google sign-in does not go through it**. Someone who has the password can still call Supabase's own password endpoint directly with the public anon key and skip the code. Closing that needs Supabase-side enforcement (for example MFA with AAL2 checks, or turning off password sign-in at Supabase and keeping passwords only in this app).

---

## 🔑 Forgot Password

Sign In → **Forgot password?** → enter email → `POST /api/auth/forgot` creates a Supabase recovery token (admin API) and emails the link through the app's own SMTP/Resend sender using `lib/email/password-reset.html` → the link opens `/auth/confirm`, which shows a **Continue** button (so mail scanners that pre-fetch links can't consume the one-time token); clicking it verifies the token and sets the session → `/reset-password` asks for **New password** and **Confirm new password**.

Requirements: `SUPABASE_SERVICE_ROLE_KEY`, working `SMTP_*` (or Resend) settings, and `NEXT_PUBLIC_APP_URL` set to the site's real URL (the emailed link is built from it). Supabase's own SMTP/email templates are **not** used. Without Supabase configured the form shows a demo message and sends nothing.

---

## 📂 Project Directory Structure

```
├── app/
│   ├── api/
│   │   ├── auth/otp/route.js          # OTP request handler (sends code via SMTP/Resend)
│   │   └── auth/verify/route.js       # OTP verify + Supabase session mint (admin API)
│   ├── auth/callback/route.js         # OAuth / magic-link session callback
│   ├── error.jsx                      # Route error boundary
│   ├── global-error.jsx               # Root error boundary
│   ├── globals.css                    # Swiss design tokens & CSS
│   ├── layout.jsx                     # HTML head, Google Fonts & metadata
│   └── page.jsx                       # Main application (Catalog, Dashboard)
├── components/
│   ├── AuthModal.jsx                  # Onboarding & Sign-in modal
│   ├── CatalogGrid.jsx                # Project cards grid view
│   ├── CatalogTable.jsx               # Editorial table view
│   ├── DashboardView.jsx              # SVG Pie chart & analytics
│   ├── EmptyCatalog.jsx               # Empty-state panel for filtered results
│   ├── Filters.jsx                    # Multi-group filter panel
│   ├── Footer.jsx                     # Editorial 3-column footer
│   ├── Header.jsx                     # Top navigation & logo
│   ├── landing/                       # Landing page (Landing, CreatorSection, WorkflowDemo, Reveal, CountUp)
│   ├── Loading.jsx                    # Spinners & loading button
│   ├── ProjectSelector.jsx            # Multi-site project switcher
│   └── SubmissionModal.jsx            # Record live URLs & notes
├── data/
│   └── backlinks.json                 # 192 curated sources
├── lib/
│   ├── data/sources.js                # Sources helper & constants
│   ├── otp-store.js                   # OTP storage (Supabase RPC / memory fallback)
│   ├── resend.js                      # SMTP (nodemailer) & Resend email clients
│   ├── storage.js                     # State persistence & 5-backlink rule
│   └── supabase/                      # Browser, SSR, and service-role Supabase clients
├── middleware.js                      # Supabase auth token refresh
├── scripts/
│   └── generate-seed.js               # SQL seed generator (from data/backlinks.json)
└── supabase/
    ├── migrations/20261008000000_init.sql
    ├── migrations/20261009000000_auth_otp_codes.sql
    ├── migrations/20261010000000_drop_unused_submission_function.sql
    └── seed.sql
```

## Notes

This project helps organize directory outreach; it does not submit listings automatically, validate the current quality of a domain, or guarantee rankings or link equity. Review each destination and its current requirements before submitting.

Found a problem or have an improvement in mind? Open a [GitHub issue](https://github.com/ismailgito/SEO-Backlinks-Tracker/issues).
