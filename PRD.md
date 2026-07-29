# PRD.md — Kedai Ops Dashboard Admin

## 1. Latar Belakang & Tujuan

Dashboard admin internal untuk "Kedai Ops" — sebuah kedai kopi/kafe santai fiktif. Digunakan oleh 1-2 orang admin untuk mengelola menu dan pesanan harian. Bukan customer-facing app.

**Tone brand:** hangat, santai, kafe kecil Indonesia — bukan resto formal atau software enterprise. Warna earthy, typography yang bersahabat.

## 2. Stack

| Layer | Tools |
|---|---|
| Framework | Next.js 15+ (App Router) |
| Styling | Tailwind CSS |
| ORM | Prisma |
| Database | MySQL (Laragon — development) |
| Auth | NextAuth.js v5 (Credentials Provider) |
| Password | bcrypt |

## 3. Fitur Inti (Fase 1 — Fondasi)

1. **Auth admin** — login/logout dengan credentials (username + password), password di-hash
2. **Kelola menu** — CRUD item menu: nama, kategori, harga, status tersedia/tidak
3. **Kelola pesanan** — admin bisa melihat daftar pesanan, menandai status (pending, diproses, selesai)
4. **Dashboard ringkas** — ringkasan: total menu aktif, pesanan hari ini, pendapatan estimasi

## 4. Skema Database

### Menu
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | Int (PK, auto) | — |
| name | String | Nama item (contoh: "Es Kopi Susu") |
| category | String | Coffee / Non-Coffee / Pastry / Snack |
| price | Int | Harga dalam Rupiah (tanpa desimal) |
| available | Boolean | true = tersedia, false = habis |
| createdAt | DateTime | — |
| updatedAt | DateTime | — |

### Order
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | Int (PK, auto) | — |
| customerName | String | Nama pelanggan/pemesan |
| status | String | pending / processing / completed |
| total | Int | Total harga (dihitung dari OrderItem) |
| createdAt | DateTime | — |
| updatedAt | DateTime | — |

### OrderItem
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | Int (PK, auto) | — |
| orderId | Int (FK → Order) | — |
| menuId | Int (FK → Menu) | — |
| quantity | Int | Jumlah item |
| price | Int | Harga satuan saat pesan (snapshot) |

### User (Admin)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | Int (PK, auto) | — |
| username | String (unique) | — |
| password | String | Hashed (bcrypt) |

## 5. Kategori Menu & Seed Data

Seed data awal — nama dan harga realistis untuk kafe kecil Indonesia:

| Kategori | Contoh Item | Harga (Rp) |
|---|---|---|
| Coffee | Kopi Hitam, Es Kopi Susu, Americano, Cappuccino, Latte, Mocha, Piccolo | 15k–35k |
| Non-Coffee | Matcha Latte, Coklat Panas, Lemon Tea, Es Coklat, Red Velvet, Thai Tea | 12k–28k |
| Pastry | Croissant, Banana Cake, Cinnamon Roll, Brownies, Cookies | 10k–22k |
| Snack | Kentang Goreng, Tahu Crispy, Pisang Goreng, Lumpia | 8k–18k |

## 6. Yang TIDAK Masuk Scope (Fase 1)

- Payment gateway / transaksi online
- Customer-facing menu page
- Real-time WebSocket / push notification
- Multi-tenant / multi-cabang
- Upload gambar menu
- Report/analytics lanjutan (cukup dashboard ringkas)
- Deployment (development lokal via Laragon dulu)

## 7. Urutan Implementasi

1. Setup project Next.js + Tailwind + Prisma
2. Desain Prisma schema + migrasi database
3. Setup NextAuth.js (Credentials) + bcrypt
4. Seed data menu
5. API routes: CRUD menu, CRUD order
6. Halaman: Login, Dashboard, Menu Management, Order Management
7. Styling dengan tone kafe
