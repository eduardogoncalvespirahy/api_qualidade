import { Request, Response, NextFunction } from "express";

export function roleMiddleware(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRoles = req.user?.roles ?? [];

    const hasRole = userRoles.some((role) => roles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        message: "Acesso negado",
      });
    }

    next();
  };
}
