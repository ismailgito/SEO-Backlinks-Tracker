# Awesome Free SEO Backlinks (2026 Edition)

A high-performance web application designed for off-page SEO, directory submission tracking, and authority building, using a Swiss Minimalist design system and a curated catalog of 194 verified sources.

---

## 🚀 Features & Architecture

### 1. Curated Inventory
- **194 verified sources** extracted, cleaned, and categorized into `data/backlinks.json`.
- Grouped into 10 Domain Rating bands: `90+`, `80–89`, `70–79`, `60–69`, `50–59`, `40–49`, `30–39`, `20–29`, `10–19`, and `<10`.
- Explicit follow attributes preserved: `✅ dofollow` (95 sources), `➖ nofollow` (41 sources), and `⚪ unverified` (58 sources).
- Direct submission URLs and domain tracking.

### 2. High-Contrast Swiss Editorial Design
- **Color Tokens**:
  - Background: `#F7F7F7` (Off-white / Light Grey)
  - Headings & Primary Text: `#111111` (Near-Black)
  - Secondary Text: `#888888` (Muted Grey)
  - Accent: `#0B6B4F` (Deep Emerald Green)
  - Borders & Dividers: `#E0E0E0`
- **Dark Mode & Light Mode**:
  - One-click Swiss Minimalist Dark Mode toggle in the top bar with Sun/Moon icons.
  - Automatically respects user system preference (`prefers-color-scheme`) and persists choice in `localStorage`.
  - Seamlessly adapts all cards, tables, SVG doughnut charts, inputs, and modals.
- **Typography & Layout**:
  - Display headers with tight negative tracking.
  - Section headers with `0.15em` wide letter spacing.
  - 3-column top navigation bar (`SEO / BL` stylized slash logo).
  - Editorial hero with stat metrics row and off-page strategy quote box.
  - View switch: Editorial Table view and Grid Card view.

### 3. Submission Workflow & 5-Backlink Rule
- **Workflow States**: `Unsubmitted`, `On Progress`, `Submitted`, `Secured`, `Rejected`, and `Unable`.
- **Timestamp Tracking**: Stores `submitted_at` and `secured_at` in UTC and formats to user's local timezone.
- **5-Backlink Rule Enforcement**:
  - Unauthenticated guests can secure up to **5 free backlinks**.
  - Attempting to secure a 6th backlink triggers the sign-up modal (enforced client-side; the app is local-first and does not sync submissions to the server).
  - Upon registering/logging in, unlimited secured backlinks are unlocked.

### 4. Interactive Dashboard & Reporting
- SVG Doughnut / Pie chart visualizing submission outcomes (`Secured`, `Submitted (Pending)`, `On Progress`, `Rejected/Unable`).
- Authority band progress bars across DR tiers.
- Real-time audit history of status transitions with timestamps.
- One-click CSV Export.

### 5. Multi-Project Support
- Supports managing and switching between multiple websites/projects (e.g. Primary SaaS, Client Site) without mixing submission data.

---

## 🛠️ How to Run Locally

### Start Development Server:
```bash
npm.cmd run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build and Run for Production:
```bash
npm.cmd run build
npm.cmd start
```

---

## 🔌 Putting In Your APIs Later

The app works **100% out of the box** in offline/local storage mode without requiring any credentials.

When you are ready to configure live Supabase authentication and email delivery (SMTP or Resend):

1. Open **`.env.local`** and insert your keys:
```env
# 1. Supabase Cloud Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# 2. Email Delivery (Gmail SMTP — recommended, no domain needed)
SMTP_USER=you@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=you@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465

# 2b. Resend Email Delivery (fallback, requires a verified domain at resend.com/domains)
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=onboarding@yourdomain.com

# 3. Settings
NEXT_PUBLIC_FREE_TIER_SECURED_LIMIT=5
```

2. Run the prepared SQL files in your Supabase SQL Editor:
- **`supabase/migrations/20261008000000_init.sql`**: Sets up PostgreSQL schema, tables (`profiles`, `projects`, `backlink_sources`, `backlink_submissions`, `submission_events`), and RLS policies.
- **`supabase/migrations/20261009000000_auth_otp_codes.sql`**: Email sign-up OTP codes table (SHA-256 hashed codes, send rate limits, failed-attempt locks) plus atomic `SECURITY DEFINER` RPC functions used by `/api/auth/otp` and `/api/auth/verify`. Until this runs, the app falls back to a single-instance in-memory OTP store.
- **`supabase/migrations/20261010000000_drop_unused_submission_function.sql`**: No-op on fresh databases; drops the legacy `record_submission_transition` RPC on databases that ran an older version of the init migration.
- **`supabase/seed.sql`**: Inserts all 194 parsed sources directly into your Supabase database.

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
│   ├── Hero.jsx                       # Editorial hero & metrics
│   ├── Loading.jsx                    # Spinners & loading button
│   ├── ProjectSelector.jsx            # Multi-site project switcher
│   └── SubmissionModal.jsx            # Record live URLs & notes
├── data/
│   └── backlinks.json                 # 194 curated sources
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