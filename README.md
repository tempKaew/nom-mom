# Nom Mom – Baby Tracking LINE Mini App

A baby tracking app where multiple LINE users can manage multiple babies. Built with Next.js 16 (App Router), TypeScript, Supabase, and TailwindCSS. Prepared for LINE LIFF login.

## Tech stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Next.js API Routes** (Route Handlers)
- **Supabase** (PostgreSQL)
- **TailwindCSS**

## Project structure

| Path | Purpose |
|------|---------|
| `app/` | Next.js App Router pages and API routes |
| `components/common/` | Reusable UI (LoadingSpinner, ErrorView, BabyAvatar, etc.) |
| `config/` | Env keys and helpers |
| `constants/` | Messages, API defaults, storage bucket names |
| `hooks/` | Client hooks (useLiffAuth, useDashboardAuth, useMe, useLogs) |
| `lib/line/` | LINE LIFF auth (server: `getLineUserIdFromRequest`, client: `initLiffAndGetToken`) |
| `lib/supabase/` | Server Supabase client (`supabaseServer`) |
| `lib/supabaseClient.ts` | Browser Supabase client (if needed) |
| `lib/apiAuth.ts` | API route helper `requireLineAuth(request)` |
| `repositories/` | Database access (users, babies, members, milk/diaper logs, invites) |
| `services/api/` | Client-side API helpers (`apiGet`, `apiPost`, `apiPatch`, `authHeaders`) |
| `types/` | Database and app types |
| `utils/` | `getBaseUrl`, `createCroppedBlob` (avatar crop) |

API routes use `requireLineAuth()` and repository functions; pages use hooks and common components.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Copy the example env file and add your Supabase credentials:

```bash
cp .env.example .env.local
```

2. In [Supabase Dashboard](https://app.supabase.com) → your project → **Settings** → **API**:
   - Set `SUPABASE_URL` to your project URL.
   - Set `SUPABASE_ANON_KEY` to your anon (public) key.

3. Run the database schema (see below) in the Supabase SQL Editor so the `babies` table and other tables exist.

### 3. Run the database SQL

1. Open [Supabase Dashboard](https://app.supabase.com) → your project.
2. Go to **SQL Editor**.
3. Copy the contents of `supabase/schema.sql` and run it.
4. This creates: `users`, `babies`, `baby_members`, `milk_logs`, `diaper_logs`, `baby_invites`, indexes, and `updated_at` triggers.
5. If you already had tables, run `supabase/migrations/001_add_created_by_and_invite_label.sql` to add new columns.
6. **If `/api/me` returns empty `babies` after adding a baby**, run `supabase/migrations/002_rls_policies_for_anon.sql` so the anon key can read/write (RLS was blocking).

7. **สำหรับอัพโหลดรูปเด็ก (แก้ไขข้อมูลเด็ก):** สร้าง Storage bucket ใน Supabase → **Storage** → **New bucket** → ชื่อ `baby-avatars` → เปิด **Public bucket** (เพื่อให้ URL รูปใช้แสดงได้)

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Try:

- **Health check:** [http://localhost:3000/api/health](http://localhost:3000/api/health) → `{"status":"ok"}`
- **Database test:** [http://localhost:3000/api/babies](http://localhost:3000/api/babies) → returns babies from Supabase (or `[]` if empty)

## Project structure

```
/app
  /api
    /health     → GET /api/health
    /babies     → GET /api/babies (test DB connection)
    /milk       → milk logs (LIFF placeholder)
    /diaper     → diaper logs (LIFF placeholder)
  /dashboard   → dashboard page (LIFF placeholder)

/lib
  supabaseClient.ts   → Supabase client (SUPABASE_URL, SUPABASE_ANON_KEY)

/types
  database.ts         → Supabase table types

/supabase
  schema.sql          → SQL schema for Supabase
```

## Environment variables

| Variable                      | Description |
|-------------------------------|-------------|
| `SUPABASE_URL`                | Supabase project URL |
| `SUPABASE_ANON_KEY`           | Supabase anon (public) API key |
| `SUPABASE_SERVICE_ROLE_KEY`  | **Recommended.** Service role key for API routes (bypasses RLS). Get from Supabase → Settings → API. Keep secret. |
| `NEXT_PUBLIC_LIFF_ID`        | LIFF ID from LINE Developers Console (LIFF tab). |
| `LIFF_CHANNEL_ID`            | **Required for auth.** Channel ID of the channel that owns the LIFF app. Used to verify LIFF ID tokens on the server. Get from LINE Developers Console → your channel → Basic settings. |

## LINE LIFF – เปิดใช้ ID token (ต้องทำ)

แอปใช้ **LIFF ID token** สำหรับยืนยันตัวตนที่เซิร์ฟเวอร์ ถ้า `liff.getIDToken()` ได้ `null` ให้ทำดังนี้:

1. เปิด [LINE Developers Console](https://developers.line.biz/console/) → เลือก Channel ที่ใช้กับ LIFF
2. ไปที่แท็บ **LIFF** → กดแก้ไข LIFF app ที่ใช้อยู่
3. ในส่วน **Scope** ให้ติ๊กเลือก **openid** (และ **profile** ถ้ามี)
4. Save แล้วให้ user **ล็อกอาออกและเข้าใหม่** (หรือเปิดแอปใน LINE ใหม่) เพื่อให้ได้ token ที่มี scope openid

ถ้าไม่เปิด openid แล้ว `liff.getIDToken()` จะคืนค่า `null` ตลอด (แม้ `liff.getProfile()` จะใช้ได้ปกติ)

## Scripts

- `npm run dev`   – Start development server
- `npm run build` – Build for production
- `npm run start` – Start production server
- `npm run lint`  – Run ESLint
- `npm install next@latest react@latest react-dom@latest eslint-config-next@latest` - Update nextjs
