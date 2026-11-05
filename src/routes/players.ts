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
import type { Request, Response } from "express";
import { prisma } from "../db.js";
import { HttpError } from "../lib/http-error.js";
import { readIdParam } from "../lib/respond.js";

const NICKNAME_TAKEN = "Nickname sudah dipakai player lain";

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}
 
/** nickname harus string non-kosong. Mengembalikan nilai yang sudah di-trim. */
function readNickname(body: unknown): string {
  const raw = (body as { nickname?: unknown } | undefined)?.nickname;
  if (typeof raw !== "string" || raw.trim() === "") {
    throw new HttpError(400, "nickname wajib diisi");
  }
  return raw.trim();
}
 
// POST /api/players
async function createPlayer(req: Request, res: Response) {
  const nickname = readNickname(req.body);
 
  if (await prisma.player.findUnique({ where: { nickname } })) {
    throw new HttpError(409, NICKNAME_TAKEN);
  }
 
  try {
    // bp 10000 & diamond 0 otomatis dari default schema
    const player = await prisma.player.create({ data: { nickname } });
    res.status(201).json({ status: true, message: "Player berhasil dibuat", data: player });
  } catch (err) {
    // dua request bersamaan dengan nickname sama lolos pengecekan di atas
    if (isUniqueViolation(err)) throw new HttpError(409, NICKNAME_TAKEN);
    throw err;
  }
}
 
// GET /api/players/:player_id
async function getPlayerById(req: Request, res: Response) {
  const playerId = readIdParam(req.params["player_id"], "player_id");
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      heroes: {
        include: { hero: { select: { name: true } } },
        orderBy: { id: "asc" },
      },
    },
  });
 
  if (!player) throw new HttpError(404, "Player tidak ditemukan");
 
  const { heroes, ...profile } = player;
  res.status(200).json({
    status: true,
    message: "Berhasil mengambil data player",
    data: {
      ...profile,
      heroes: heroes.map((ph) => ({
        heroId: ph.heroId,
        name: ph.hero.name,
        currency: ph.currency,
        pricePaid: ph.pricePaid,
      })),
    },
  });
}
 
// PATCH /api/players/:player_id
// Urutan cek: 404 player -> 400 nickname kosong -> 409 nickname dipakai player lain
async function updatePlayer(req: Request, res: Response) {
  const playerId = readIdParam(req.params["player_id"], "player_id");
  const existing = await prisma.player.findUnique({ where: { id: playerId } });
  if (!existing) throw new HttpError(404, "Player tidak ditemukan");
 
  const nickname = readNickname(req.body);
 
  const taken = await prisma.player.findFirst({
    where: { nickname, NOT: { id: existing.id } },
    select: { id: true },
  });
  if (taken) throw new HttpError(409, NICKNAME_TAKEN);
 
  try {
    const player = await prisma.player.update({
      where: { id: existing.id },
      data: { nickname },
    });
    res.status(200).json({ status: true, message: "Nickname player berhasil diubah", data: player });
  } catch (err) {
    if (isUniqueViolation(err)) throw new HttpError(409, NICKNAME_TAKEN);
    throw err;
  }
}
 
// DELETE /api/players/:player_id
// Data PlayerHero ikut terhapus lewat onDelete: Cascade di schema.
async function deletePlayer(req: Request, res: Response) {
  const playerId = readIdParam(req.params["player_id"], "player_id");
  const existing = await prisma.player.findUnique({ where: { id: playerId } });
  if (!existing) throw new HttpError(404, "Player tidak ditemukan");
 
  await prisma.player.delete({ where: { id: existing.id } });
 
  res.status(200).json({
    status: true,
    message: "Player berhasil dihapus",
    data: { id: existing.id, nickname: existing.nickname },
  });
}
 
// ---------- Routes ----------
export const playerRouter = Router();
 
playerRouter.post("/", createPlayer);
playerRouter.get("/:player_id", getPlayerById);
playerRouter.patch("/:player_id", updatePlayer);
playerRouter.delete("/:player_id", deletePlayer);
 
// Fitur 5 & 6 (topup, matches, heroes) milik Orang C:
// tambahkan di router ini, atau mount router C ke "/api/players" juga.
 
