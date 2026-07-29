# AGENTS.md — Kedai Ops Dashboard Admin

Dibaca oleh semua subagent di awal tiap sesi. Project **dashboard admin kafe** — prioritas: fondasi data benar dulu sebelum UI.

## Arsitektur Agent

- **Manager** — orkestrasi task, breakdown kerja, review integrasi akhir, keputusan arsitektur
- **Backend** — Prisma schema, API routes (Next.js Route Handlers), auth, logika bisnis
- **Frontend** — Komponen UI (React Server Components + Client Components), styling Tailwind, layout halaman
- **Security** — Auth flow, proteksi route, validasi input, password hashing, review celah keamanan

## Pemilihan Model per Jenis Tugas

| Jenis tugas | Contoh konkret | Model |
|---|---|---|
| Boilerplate & setup | `create-next-app`, install deps, struktur folder | `opencode-go/deepseek-v4-flash` |
| Schema & backend logic | Prisma schema, API routes, auth implementation | `opencode-go/kimi-k2.7-code` |
| Keputusan arsitektur & review | Desain schema, keputusan relasi, review integrasi | `opencode-go/deepseek-v4-pro` (manager) |
| Komponen UI & styling | React components, Tailwind, Server/Client split | `opencode-go/glm-5.2` |
| Review keamanan | Auth middleware, password hashing, SQL injection check | `opencode-go/qwen3.7-max` (security) |

## Aturan Umum (Semua Agent)

1. **Ikuti PRD.md sebagai sumber kebenaran scope.** Fokus pada fitur yang sudah disepakati, jangan tambah fitur tanpa persetujuan manager.
2. **Update PROGRESS.md di akhir sesi**, sertakan insight dan status per tahap.
3. **Session handoff:** baca PROGRESS.md di awal sesi baru.

## Aturan Khusus Backend

- Semua password di-hash dengan bcrypt — jangan pernah simpan plaintext.
- API routes pakai Next.js Route Handlers (`app/api/...`), bukan Pages Router.
- Prisma schema harus punya relasi eksplisit (ForeignKey) antara Order → OrderItem.
- Validasi input di server-side (tidak bergantung pada client-side validation saja).

## Aturan Khusus Frontend

- Pakai React Server Components (RSC) sebagai default. Client Components hanya untuk interaktivitas (form, state, effects).
- Tone visual: hangat, santai, kafe — bukan kaku enterprise. Warna earthy/brown tones.
- Jangan styling dulu sebelum schema dan data dasar beres — ikuti urutan PRD.

## Aturan Khusus Security

- Auth: NextAuth.js (Auth.js v5) dengan Credentials Provider.
- Middleware untuk proteksi route: hanya `/login` yang public, sisanya harus authenticated.
- Jangan hardcode credential di kode — semua dari `.env`.

## Batas Scope

- Tidak implementasi: payment gateway, real-time order tracking, customer-facing menu page, deployment.
- Fase awal: admin bisa login, kelola menu (CRUD), lihat dan update order.
