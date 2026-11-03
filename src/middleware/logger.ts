import type { Request, Response, NextFunction } from "express";

// Mencatat setiap request setelah response selesai, misal: GET /api/heroes 200
export function logger(req: Request, res: Response, next: NextFunction): void {
  res.on("finish", () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode}`);
  });
  next();
}
