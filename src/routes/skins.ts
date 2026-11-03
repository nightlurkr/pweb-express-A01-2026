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

export const skinRouter = Router();
