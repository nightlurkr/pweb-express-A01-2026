import { readFileSync } from "node:fs";
import { prisma } from "../src/db.js";
import type { Role, Lane, Rarity, Currency } from "../src/generated/prisma/client.js";

interface HeroRaw {
  name: string;
  primaryRole: string;
  primaryLane: string;
  releaseYear: number;
  priceBP: number | null;
  priceDiamond: number | null;
}

interface SkinRaw {
  name: string;
  heroId: number;
  rarity: string;
  priceDiamond: number | null;
}

function readJson<T>(path: string): T[] {
  return JSON.parse(readFileSync(path, "utf-8")) as T[];
}

async function main(): Promise<void> {
  // 1. Kosongkan semua tabel sekaligus reset id ke 1.
  await prisma.$executeRawUnsafe(
    'TRUNCATE "PlayerHero", "Player", "Skin", "Hero" RESTART IDENTITY CASCADE'
  );

  // 2. Hero. Urutan di file sudah benar, jadi Miya dapat id 1 dan Hirara id 133.
  const heroes = readJson<HeroRaw>("data/heroes.json");
  await prisma.hero.createMany({
    data: heroes.map((h) => ({
      name: h.name,
      role: h.primaryRole as Role,
      lane: h.primaryLane as Lane,
      releaseYear: h.releaseYear,
      priceBP: h.priceBP,
      priceDiamond: h.priceDiamond,
    })),
  });

  // 3. Skin.
  const skins = readJson<SkinRaw>("data/skins.json");
  await prisma.skin.createMany({
    data: skins.map((s) => ({
      name: s.name,
      heroId: s.heroId,
      rarity: s.rarity as Rarity,
      priceDiamond: s.priceDiamond,
    })),
  });

  // 4. Tiga player beserta hero yang sudah dimiliki.
  await prisma.player.createMany({
    data: [
      { nickname: "ArekITS", bp: 1500, diamond: 75 },
      { nickname: "SangPushRank", bp: 13000, diamond: 2892 },
      { nickname: "MageSurabaya", bp: 10000, diamond: 0 },
    ],
  });

  const owned: Array<{
    playerId: number;
    heroId: number;
    currency: Currency;
    pricePaid: number;
  }> = [
    { playerId: 1, heroId: 18, currency: "BP", pricePaid: 2000 },
    { playerId: 1, heroId: 1, currency: "BP", pricePaid: 10800 },
    { playerId: 2, heroId: 84, currency: "DIAMOND", pricePaid: 599 },
    { playerId: 2, heroId: 56, currency: "BP", pricePaid: 32000 },
  ];
  await prisma.playerHero.createMany({ data: owned });

  console.log(
    `Seed selesai: ${heroes.length} hero, ${skins.length} skin, 3 player, ${owned.length} playerHero`
  );
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
