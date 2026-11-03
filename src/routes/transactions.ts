// Fitur 5 (Top Up dan Match) serta Fitur 6 (Beli Hero). Dikerjakan oleh Orang C.
import { Router } from "express";
import type { Currency } from "../generated/prisma/client.js";
import { prisma } from "../db.js";
import { HttpError } from "../lib/http-error.js";
import { sendOk, readIdParam } from "../lib/respond.js";

export const transactionRouter = Router();

const MATCH_REWARD = { WIN: 300, LOSE: 100 } as const;
type MatchResult = keyof typeof MATCH_REWARD;

function isMatchResult(value: unknown): value is MatchResult {
  return value === "WIN" || value === "LOSE";
}

function isCurrency(value: unknown): value is Currency {
  return value === "BP" || value === "DIAMOND";
}

// POST /api/players/:player_id/topup
transactionRouter.post("/:player_id/topup", async (req, res) => {
  const playerId = readIdParam(req.params["player_id"], "player_id");
  const amount = (req.body as Record<string, unknown>)["amount"];

  if (!Number.isInteger(amount) || (amount as number) <= 0) {
    throw new HttpError(400, "amount harus bilangan bulat lebih dari 0");
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (player === null) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  const updated = await prisma.player.update({
    where: { id: playerId },
    data: { diamond: { increment: amount as number } },
  });

  sendOk(res, 200, "Top up berhasil", {
    id: updated.id,
    nickname: updated.nickname,
    amount: amount as number,
    diamond: updated.diamond,
  });
});

// POST /api/players/:player_id/matches
transactionRouter.post("/:player_id/matches", async (req, res) => {
  const playerId = readIdParam(req.params["player_id"], "player_id");
  const result = (req.body as Record<string, unknown>)["result"];

  if (!isMatchResult(result)) {
    throw new HttpError(400, "result harus WIN atau LOSE");
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (player === null) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  const reward = MATCH_REWARD[result];
  const updated = await prisma.player.update({
    where: { id: playerId },
    data: { bp: { increment: reward } },
  });

  sendOk(res, 200, "Match selesai", {
    id: updated.id,
    nickname: updated.nickname,
    result,
    bpEarned: reward,
    bp: updated.bp,
  });
});

// POST /api/players/:player_id/heroes
transactionRouter.post("/:player_id/heroes", async (req, res) => {
  const playerId = readIdParam(req.params["player_id"], "player_id");
  const body = req.body as Record<string, unknown>;
  const heroId = body["heroId"];
  const currency = body["currency"];

  // Pemeriksaan dilakukan satu per satu dan berhenti di kegagalan pertama.
  if (!Number.isInteger(heroId) || (heroId as number) < 1) {
    throw new HttpError(400, "heroId wajib diisi berupa angka");
  }
  if (!isCurrency(currency)) {
    throw new HttpError(400, "currency harus BP atau DIAMOND");
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (player === null) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  const hero = await prisma.hero.findUnique({ where: { id: heroId as number } });
  if (hero === null) {
    throw new HttpError(404, "Hero tidak ditemukan");
  }

  const price = currency === "BP" ? hero.priceBP : hero.priceDiamond;
  if (price === null) {
    throw new HttpError(
      400,
      `${hero.name} tidak bisa dibeli dengan ${currency}`
    );
  }

  const owned = await prisma.playerHero.findUnique({
    where: { playerId_heroId: { playerId, heroId: hero.id } },
  });
  if (owned !== null) {
    throw new HttpError(409, `Player sudah memiliki ${hero.name}`);
  }

  const balance = currency === "BP" ? player.bp : player.diamond;
  if (balance < price) {
    throw new HttpError(400, `Saldo ${currency} tidak cukup`);
  }

  // Potong saldo dan catat kepemilikan dalam satu transaction,
  // supaya keduanya berhasil bersama atau gagal bersama.
  const [updatedPlayer] = await prisma.$transaction([
    prisma.player.update({
      where: { id: playerId },
      data:
        currency === "BP"
          ? { bp: { decrement: price } }
          : { diamond: { decrement: price } },
    }),
    prisma.playerHero.create({
      data: { playerId, heroId: hero.id, currency, pricePaid: price },
    }),
  ]);

  sendOk(res, 201, "Hero berhasil dibeli", {
    hero: { id: hero.id, name: hero.name },
    currency,
    pricePaid: price,
    balance: { bp: updatedPlayer.bp, diamond: updatedPlayer.diamond },
  });
});
