// Fitur 7: Statistik toko. Dikerjakan oleh Orang C.
import { Router } from "express";
import { prisma } from "../db.js";
import { sendOk } from "../lib/respond.js";

export const statisticsRouter = Router();

// GET /api/statistics
statisticsRouter.get("/", async (_req, res) => {
  const [totalPlayers, totalHeroesOwned, diamondSum, ownedPerHero, perRole] =
    await Promise.all([
      prisma.player.count(),
      prisma.playerHero.count(),
      prisma.player.aggregate({ _sum: { diamond: true } }),
      prisma.playerHero.groupBy({
        by: ["heroId"],
        _count: { heroId: true },
        // Kalau jumlah pemiliknya seri, hero dengan id terkecil yang dipilih.
        orderBy: [{ _count: { heroId: "desc" } }, { heroId: "asc" }],
        take: 1,
      }),
      prisma.hero.groupBy({
        by: ["role"],
        _count: { role: true },
        orderBy: { _count: { role: "desc" } },
      }),
    ]);

  // groupBy hanya memberi heroId, jadi namanya diambil terpisah.
  const top = ownedPerHero[0];
  const topHero =
    top === undefined
      ? null
      : await prisma.hero.findUnique({
          where: { id: top.heroId },
          select: { id: true, name: true },
        });

  sendOk(res, 200, "Berhasil mengambil statistik", {
    totalPlayers,
    totalHeroesOwned,
    totalDiamond: diamondSum._sum.diamond ?? 0,
    mostOwnedHero:
      topHero === null || top === undefined
        ? null
        : {
            heroId: topHero.id,
            name: topHero.name,
            owners: top._count.heroId,
          },
    heroesPerRole: perRole.map((row) => ({
      role: row.role,
      total: row._count.role,
    })),
  });
});
