// Fitur 3: Skin. Bagian Orang B (Dave).
//
// Endpoint yang perlu dibuat:
//   GET /api/skins          query: page, limit, heroId, rarity. include hero.
//                           Pakai readPaging dan buildMetadata dari lib/respond.
//   GET /api/skins/:skin_id include hero. Kalau tidak ada, lempar
//                           new HttpError(404, "Skin tidak ditemukan").
//
// Contoh pola bisa dilihat di routes/heroes.ts.
import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "../db.js";
import { HttpError } from "../lib/http-error.js";
import {
  sendOk,
  readPaging,
  buildMetadata,
  readIdParam,
} from "../lib/respond.js";
import { Rarity } from "../generated/prisma/enums.js";
import type { Prisma } from "../generated/prisma/client.js";
 
const RARITIES = Object.values(Rarity);
 
function queryString(value: unknown, label: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new HttpError(400, `${label} harus berupa teks`);
  }
  return value;
}

// GET /api/skins?page=&limit=&heroId=&rarity=
async function getAllSkins(req: Request, res: Response) {
  const { page, limit } = readPaging(req.query);
  const where: Prisma.SkinWhereInput = {};
 
  const heroIdRaw = queryString(req.query["heroId"], "heroId");
  if (heroIdRaw !== undefined) {
    where.heroId = readIdParam(heroIdRaw, "heroId");
  }
 
  const rarityRaw = queryString(req.query["rarity"], "rarity");
  if (rarityRaw !== undefined) {
    const rarity = rarityRaw.toUpperCase() as Rarity;
    if (!RARITIES.includes(rarity)) {
      throw new HttpError(400, `rarity harus salah satu dari: ${RARITIES.join(", ")}`);
    }
    where.rarity = rarity;
  }
 
  const [totalItems, skins] = await prisma.$transaction([
    prisma.skin.count({ where }),
    prisma.skin.findMany({
      where,
      include: { hero: { select: { name: true } } },
      orderBy: { id: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
 
  res.status(200).json({
    status: true,
    message: "Berhasil mengambil data skin",
    data: skins,
    metadata: buildMetadata(page, limit, totalItems),
  });
}
 
// GET /api/skins/:skin_id
async function getSkinById(req: Request, res: Response) {
  const rawSkinId = req.params["skin_id"];
  const parsedSkinId = Number(rawSkinId);
  const skinId =
    Number.isInteger(parsedSkinId) && parsedSkinId > 0 ? parsedSkinId : null;
  // id non-angka otomatis dianggap "tidak ada" -> 404
  const skin =
    skinId === null
      ? null
      : await prisma.skin.findUnique({
          where: { id: skinId },
          include: { hero: true },
        });
 
  if (!skin) throw new HttpError(404, "Skin tidak ditemukan");
 
  res.status(200).json({
    status: true,
    message: "Berhasil mengambil detail skin",
    data: skin,
  });
}
 
// ---------- Routes ----------
export const skinRouter = Router();

skinRouter.get("/", getAllSkins);
skinRouter.get("/:skin_id", getSkinById);
