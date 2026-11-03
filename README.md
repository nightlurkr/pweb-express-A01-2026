# MLBB Shop: Diamond & BP

Praktikum Modul 4 Pemrograman Web (ET234305), Kelompok A01.
Backend Express 5 + TypeScript + Prisma ORM 7 + PostgreSQL (Neon).

## Pembagian Tugas

| Bagian | Nama | Lingkup |
|---|---|---|
| A | Ryan Adya Purwanto | Setup project, schema Prisma, seed, middleware, `/health`, Fitur 2 (Hero) |
| B | Dave | Fitur 3 (Skin), Fitur 4 (Player) |
| C | Ryan Adya Purwanto | Fitur 5 (Top Up dan Match), Fitur 6 (Beli Hero), Fitur 7 (Statistik) |

## Cara Menjalankan

1. Install dependency.

   ```
   npm install
   ```

2. Buat database di Neon, lalu salin dua connection string ke file `.env`.
   Contohnya ada di `.env.example`. File `.env` tidak boleh di-commit.

   ```
   DATABASE_URL  = connection string pooled, dipakai aplikasi
   DIRECT_URL    = connection string direct (unpooled), dipakai Prisma CLI
   ```

3. Buat tabel di database lalu generate Prisma Client.

   ```
   npx prisma migrate dev --name init
   npx prisma generate
   ```

4. Taruh `heroes.json` dan `skins.json` ke folder `data/`.

5. Jalankan seed, lalu cek isinya.

   ```
   npm run seed
   npx prisma studio
   ```

   Harus terisi 133 hero, 892 skin, dan 3 player.

6. Jalankan server.

   ```
   npm run dev
   ```

   Cek `http://localhost:3000/health` di browser.

## Struktur Folder

```
prisma/
  schema.prisma          4 tabel dan 4 enum
  seed.ts                TRUNCATE lalu isi hero, skin, player, playerHero
src/
  db.ts                  PrismaClient dengan @prisma/adapter-neon
  index.ts               setup Express, urutan middleware, daftar router
  lib/
    http-error.ts        class HttpError
    respond.ts           format response sukses dan gagal, pagination
  middleware/
    logger.ts            catat setiap request di terminal
    error-handler.ts     notFound dan errorHandler
  routes/
    heroes.ts            Fitur 2, bagian A
    skins.ts             Fitur 3, bagian B
    players.ts           Fitur 4, bagian B
    transactions.ts      Fitur 5 dan 6, bagian C
    statistics.ts        Fitur 7, bagian C
data/                    heroes.json dan skins.json, tidak ikut repo
```

## Format Response

Sukses:

```json
{ "status": true, "message": "...", "data": [], "metadata": {} }
```

Gagal:

```json
{ "status": false, "message": "..." }
```

`metadata` hanya muncul di endpoint yang memakai pagination, berisi
`currentPage`, `limit`, `totalItems`, dan `totalPages`.

## Daftar Endpoint

| Fitur | Metode | Endpoint | Bagian |
|---|---|---|---|
| Health | GET | `/health` | A |
| Hero | GET | `/api/heroes` | A |
| Hero | GET | `/api/heroes/:hero_id` | A |
| Hero | POST | `/api/heroes` | A |
| Skin | GET | `/api/skins` | B |
| Skin | GET | `/api/skins/:skin_id` | B |
| Player | POST | `/api/players` | B |
| Player | GET | `/api/players/:player_id` | B |
| Player | PATCH | `/api/players/:player_id` | B |
| Player | DELETE | `/api/players/:player_id` | B |
| Top Up | POST | `/api/players/:player_id/topup` | C |
| Match | POST | `/api/players/:player_id/matches` | C |
| Beli Hero | POST | `/api/players/:player_id/heroes` | C |
| Statistik | GET | `/api/statistics` | C |
