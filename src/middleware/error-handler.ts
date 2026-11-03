import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../lib/http-error.js";
import { sendFail } from "../lib/respond.js";

export function notFound(_req: Request, res: Response): void {
  sendFail(res, 404, "Endpoint tidak ditemukan");
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof HttpError) {
    sendFail(res, err.status, err.message);
    return;
  }
  console.error(err);
  sendFail(res, 500, "Terjadi kesalahan pada server");
}
