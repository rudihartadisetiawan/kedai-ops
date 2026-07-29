# PROGRESS.md — Kedai Ops Dashboard Admin

## Status: Visual Overhaul Selesai (Fase 1 Complete ✅)

### Done

| # | Tahap | Status | Detail |
|---|---|---|---|
| 1 | Pivot dokumen | ✅ | PRD.md & AGENTS.md di-overwrite dari project scraper ke dashboard admin kafe |
| 2 | Next.js scaffold | ✅ | App Router + TypeScript + Tailwind CSS v4 |
| 3 | Prisma schema | ✅ | 4 model: User, Menu, Order, OrderItem — relasi FK + index |
| 4 | Database + seed | ✅ | MySQL `kedaiops` di Laragon, 28 menu + 1 admin user |
| 5 | Auth | ✅ | NextAuth v5, Credentials + bcryptjs + JWT |
| 6 | Middleware | ✅ | Proteksi semua route kecuali `/login` & `/api/auth/*` |
| 7 | API routes | ✅ | 5 route group: menu (CRUD), orders (CRUD), dashboard (stats) |
| 8 | Login page | ✅ | Client Component, signIn credentials, error handling, kafe tone |
| 9 | Admin layout | ✅ | Route group `(admin)`, sidebar nav + username + logout |
| 10 | Dashboard page | ✅ | 4 stat cards: menu aktif, pesanan hari ini, pendapatan, pending |
| 11 | Menu management | ✅ | Tabel list + modal add/edit + toggle available + delete |
| 12 | Orders management | ✅ | List order cards + inline status update + delete |
| 13 | Order detail | ✅ | Server Component, info pesanan + tabel item detail |
| 14 | Theme | ✅ | Earthy/warm tones: cream bg, brown text, accent terracotta |
| 15 | Build fix | ✅ | Fixed Next.js 16 async params (`Promise<{ id }>`) di API routes |
| 16 | Dashboard overhaul | ✅ | Bento layout asimetris, pipeline order, sales chart, top 5 menu |
| 17 | Sidebar identity | ✅ | SVG wordmark kopi, decorative gradient, active accent bar |
| 18 | Sales chart | ✅ | Pure CSS bar chart 7 hari, hover tooltip, client component |
| 19 | API extend | ✅ | Dashboard API: salesChart, topMenu, orderStatusBreakdown |
| 20 | Seed pesanan | ✅ | 85 pesanan dummy 7 hari, variasi status, pola jam sibuk kafe |
| 21 | Menu & Orders polish | ✅ | Header konsisten, status dot, border-left warna, accent color fix |
| 22 | Deployment prep | ✅ | postinstall script, vercel-ready, env vars documented |

### Struktur Project (Final)

```
src/
├── app/
│   ├── (admin)/                    # Route group — semua halaman authenticated
│   │   ├── layout.tsx              # Sidebar + wrapper SessionProvider
│   │   ├── page.tsx                # Dashboard (/)  
│   │   ├── menu/page.tsx           # Kelola menu (/menu)
│   │   ├── orders/page.tsx         # Daftar pesanan (/orders)
│   │   └── orders/[id]/page.tsx    # Detail pesanan (/orders/:id)
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── dashboard/route.ts
│   │   ├── menu/route.ts + [id]/route.ts
│   │   └── orders/route.ts + [id]/route.ts
│   ├── login/page.tsx              # Login — satu-satunya public route
│   ├── layout.tsx                  # Root layout
│   └── globals.css                 # Tailwind v4 + cafe theme
├── components/
│   ├── providers.tsx               # SessionProvider wrapper
│   ├── sidebar.tsx                 # Nav sidebar — SVG logo + active accent bar
│   ├── sales-chart.tsx             # 7-day bar chart (Client Component)
│   └── logout-button.tsx           # Logout button
├── auth.ts                         # NextAuth config
├── lib/prisma.ts                   # Prisma singleton
├── proxy.ts                        # Route protection (Next.js 16 convention)
└── types/next-auth.d.ts
```

### Credential Development

| Field | Value |
|---|---|
| URL | http://localhost:3000 |
| Username | `admin` |
| Password | `admin123` |
| DB | MySQL `kedaiops` (root, no password) |

### Notes

- Prisma 7 wajib driver adapter — pakai `@prisma/adapter-mariadb`
- Next.js 16: params di route handler & page adalah `Promise<T>`, harus di-`await`
- Next.js 16: `middleware.ts` deprecated → migrasi ke `proxy.ts` dengan `getToken` dari `next-auth/jwt` (bukan `auth()` wrapper)
- Login adalah satu-satunya halaman public; semua route lain diproteksi proxy
- Semua halaman pakai tone kafe: earthy brown, cream background, terracotta accent

### Tidak Masuk Scope (Sesuai PRD)

- Payment gateway, real-time tracking, customer-facing page, upload gambar

### File yang Dihapus

- `src/app/page.tsx` — boilerplate Next.js, digantikan `(admin)/page.tsx`
- `src/middleware.ts` — deprecated di Next.js 16, digantikan `src/proxy.ts`

---

**Fase 1 — Fondasi: SELESAI.** Admin bisa login, kelola menu (CRUD), lihat & update pesanan, lihat dashboard ringkasan.

---

## Deployment Guide (Vercel + MySQL Cloud)

### 1. Database Production

Butuh MySQL server yang bisa diakses publik. Opsi:
- **Aiven MySQL** (reuse project pertama)
- **PlanetScale** (serverless MySQL)
- **Railway** / **TiDB Cloud** / lainnya

**PENTING**: Jalankan `npx prisma migrate deploy` di production database (atau `npx prisma db push` untuk setup cepat) dan seed data manual via `npx tsx prisma/seed.ts`.

### 2. Environment Variables di Vercel

| Key | Value |
|---|---|
| `DATABASE_URL` | `mysql://user:pass@host:3306/kedaiops` (production MySQL) |
| `AUTH_SECRET` | String random panjang (`openssl rand -base64 32`) |
| `AUTH_URL` | `https://nama-project.vercel.app` (URL production) |

### 3. Deploy ke Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set env vars
vercel env add DATABASE_URL
vercel env add AUTH_SECRET
vercel env add AUTH_URL

# Deploy ulang
vercel --prod
```

Atau via Vercel Dashboard: import Git repo → set env vars → deploy.

### 4. Post-Deploy (sekali)

```bash
# Dari local, arahkan ke production database
DATABASE_URL="mysql://user:pass@production-host:3306/kedaiops" npx prisma migrate deploy
DATABASE_URL="mysql://user:pass@production-host:3306/kedaiops" npx tsx prisma/seed.ts
```

### 5. Verifikasi

- Buka production URL → redirect ke `/login`
- Login: `admin` / `admin123`
- Dashboard tampil dengan data seed
- Menu & orders berfungsi

### Catatan Vercel

- `postinstall: "prisma generate"` sudah di `package.json` — Prisma Client di-generate saat build
- Proxy (`proxy.ts`) jalan di Node.js runtime — no issues
- `bcryptjs` pure JS — compatible dengan serverless
- `mariadb` driver pure JS — compatible, bisa konek ke MySQL manapun
- Cold start ~1-2 detik untuk Prisma Client connection
