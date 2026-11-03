// Fitur 4: Player. Bagian Orang B (Dave).
//
// Endpoint yang perlu dibuat:
//   POST   /api/players             body: nickname saja. Saldo ikut default schema.
//                                   kosong 400, sudah dipakai 409, berhasil 201.
//   GET    /api/players/:player_id  include daftar hero milik player.
//                                   Bentuk heroes: [{ heroId, name, currency, pricePaid }]
//                                   Tidak ada 404.
//   PATCH  /api/players/:player_id  ganti nickname.
//                                   player tidak ada 404, kosong 400, bentrok 409.
//   DELETE /api/players/:player_id  hapus player. PlayerHero ikut terhapus
//                                   lewat onDelete: Cascade. Tidak ada 404.
//
// Jangan bikin route POST /:player_id/heroes di sini, itu ada di
// routes/transactions.ts (bagian Orang C).
import { Router } from "express";

export const playerRouter = Router();
