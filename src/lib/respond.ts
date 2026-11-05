import type { Response } from "express";
import { HttpError } from "./http-error.js";

export interface Metadata {
  currentPage: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export function sendOk(
  res: Response,
  status: number,
  message: string,
  data: unknown,
  metadata?: Metadata
): void {
  if (metadata === undefined) {
    res.status(status).json({ status: true, message, data });
    return;
  }
  res.status(status).json({ status: true, message, data, metadata });
}

export function sendFail(res: Response, status: number, message: string): void {
  res.status(status).json({ status: false, message });
}

// page dan limit dari query string. Default page=1, limit=10.
export function readPaging(query: unknown): { page: number; limit: number } {
  const q = query as Record<string, unknown>;
  const page = toPositiveInt(q["page"], 1);
  const limit = toPositiveInt(q["limit"], 10);
  return { page, limit };
}

export function buildMetadata(
  page: number,
  limit: number,
  totalItems: number
): Metadata {
  return {
    currentPage: page,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
  };
}

function toPositiveInt(value: unknown, fallback: number): number {
  if (typeof value !== "string") return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return parsed;
}

// Dipakai untuk :hero_id, :skin_id, :player_id
export function readIdParam(raw: unknown, label: string): number {
  if (typeof raw !== "string") {
    throw new HttpError(400, `${label} harus berupa angka`);
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new HttpError(400, `${label} harus berupa angka`);
  }
  return parsed;
}
