// Fitur 2: Hero. Dikerjakan oleh Orang A.
import { Router } from "express";
import type { Prisma, Role, Lane } from "../generated/prisma/client.js";
import { prisma } from "../db.js";
import { HttpError } from "../lib/http-error.js";
import {
  sendOk,
  readPaging,
  buildMetadata,
  readIdParam,
} from "../lib/respond.js";

export const heroRouter = Router();

const ROLES: Role[] = [
  "TANK",
  "FIGHTER",
  "ASSASSIN",
  "MAGE",
  "MARKSMAN",
  "SUPPORT",
];
const LANES: Lane[] = ["EXP", "GOLD", "MID", "JUNGLE", "ROAM"];

function isRole(value: unknown): value is Role {
  return typeof value === "string" && ROLES.includes(value as Role);
}

function isLane(value: unknown): value is Lane {
  return typeof value === "string" && LANES.includes(value as Lane);
}

// GET /api/heroes?page=&limit=&search=&role=
heroRouter.get("/", async (req, res) => {
  const { page, limit } = readPaging(req.query);
  const where: Prisma.HeroWhereInput = {};

  const search = req.query["search"];
  if (typeof search === "string" && search.length > 0) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const role = req.query["role"];
  if (role !== undefined) {
    if (!isRole(role)) {
      throw new HttpError(400, "Role tidak valid");
    }
    where.role = role;
  }

  // Hitung total dan ambil satu halaman dalam satu perjalanan ke database.
  const [totalItems, heroes] = await Promise.all([
    prisma.hero.count({ where }),
    prisma.hero.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: "asc" },
    }),
  ]);

  sendOk(
    res,
    200,
    "Berhasil mengambil data hero",
    heroes,
    buildMetadata(page, limit, totalItems)
  );
});

// GET /api/heroes/:hero_id
heroRouter.get("/:hero_id", async (req, res) => {
  const id = readIdParam(req.params["hero_id"], "hero_id");

  const hero = await prisma.hero.findUnique({
    where: { id },
    include: { skins: true },
  });
  if (hero === null) {
    throw new HttpError(404, "Hero tidak ditemukan");
  }

  sendOk(res, 200, "Berhasil mengambil detail hero", hero);
});

// POST /api/heroes
heroRouter.post("/", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const { name, role, lane, releaseYear, priceBP, priceDiamond } = body;

  // Urutan pemeriksaan sesuai soal: wajib diisi dulu, baru cek duplikat.
  if (typeof name !== "string" || name.trim().length === 0) {
    throw new HttpError(400, "name wajib diisi");
  }
  if (!isRole(role)) {
    throw new HttpError(400, "role wajib diisi dan harus role yang valid");
  }
  if (!isLane(lane)) {
    throw new HttpError(400, "lane wajib diisi dan harus lane yang valid");
  }
  if (!Number.isInteger(releaseYear)) {
    throw new HttpError(400, "releaseYear wajib diisi berupa angka");
  }

  const existing = await prisma.hero.findUnique({ where: { name: name.trim() } });
  if (existing !== null) {
    throw new HttpError(409, "Nama hero sudah digunakan");
  }

  const hero = await prisma.hero.create({
    data: {
      name: name.trim(),
      role,
      lane,
      releaseYear: releaseYear as number,
      priceBP: optionalPrice(priceBP, "priceBP"),
      priceDiamond: optionalPrice(priceDiamond, "priceDiamond"),
    },
  });

  sendOk(res, 201, "Hero berhasil dibuat", hero);
});

// priceBP dan priceDiamond boleh kosong, tapi kalau diisi harus angka bulat.
function optionalPrice(value: unknown, label: string): number | null {
  if (value === undefined || value === null) return null;
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new HttpError(400, `${label} harus berupa angka bulat`);
  }
  return value as number;
}
