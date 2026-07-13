import { Request, Response, CookieOptions } from "express";
import { AuthService } from "../services/auth.service";

/** Request com os cookies parseados (requer app.use(cookieParser())). */
type RequestWithCookies = Request & { cookies?: Record<string, string> };

export class AuthController {
  private service = new AuthService();

  private static readonly ACCESS_COOKIE = "token";
  private static readonly REFRESH_COOKIE = "refreshToken";

  // Alinhados com o service: JWT expiresIn "1d" e REFRESH_TTL_DAYS = 7.
  private static readonly ACCESS_MAX_AGE = 1000 * 60 * 60 * 24; // 1 dia
  private static readonly REFRESH_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // 7 dias

  /**
   * Opções base do cookie de autenticação.
   * - httpOnly: inacessível via JS (mitiga XSS).
   * - secure: HTTPS em produção (obrigatório quando sameSite='none').
   * - sameSite: 'lax' para front e API no mesmo site; se forem domínios
   *   diferentes (cross-site), defina AUTH_COOKIE_CROSS_SITE=true → 'none'.
   */
  private static baseCookie(): CookieOptions {
    const isProd = process.env.NODE_ENV === "production";
    const crossSite = process.env.AUTH_COOKIE_CROSS_SITE === "true";

    return {
      httpOnly: true,
      secure: isProd || crossSite,
      sameSite: crossSite ? "none" : "lax",
      path: "/",
      // domain: process.env.AUTH_COOKIE_DOMAIN, // para compartilhar entre subdomínios
    };
  }

  private static accessCookieOptions(): CookieOptions {
    return {
      ...AuthController.baseCookie(),
      maxAge: AuthController.ACCESS_MAX_AGE,
    };
  }

  private static refreshCookieOptions(): CookieOptions {
    return {
      ...AuthController.baseCookie(),
      maxAge: AuthController.REFRESH_MAX_AGE,
      // Idealmente restrito à rota de refresh (menos exposição):
      path: process.env.AUTH_REFRESH_PATH || "/",
    };
  }

  /** Grava os cookies de acesso e refresh na resposta. */
  private static setAuthCookies(
    res: Response,
    token: string,
    refreshToken?: string,
  ): void {
    res.cookie(
      AuthController.ACCESS_COOKIE,
      token,
      AuthController.accessCookieOptions(),
    );
    if (refreshToken) {
      res.cookie(
        AuthController.REFRESH_COOKIE,
        refreshToken,
        AuthController.refreshCookieOptions(),
      );
    }
  }

  /** Remove os cookies de acesso e refresh (mesmas opções, menos maxAge). */
  private static clearAuthCookies(res: Response): void {
    const { maxAge: _a, ...access } = AuthController.accessCookieOptions();
    const { maxAge: _r, ...refresh } = AuthController.refreshCookieOptions();
    res.clearCookie(AuthController.ACCESS_COOKIE, access);
    res.clearCookie(AuthController.REFRESH_COOKIE, refresh);
  }

  login = async (req: Request, res: Response) => {
    try {
      const { username, email, registerNumber, password, systemId } = req.body;

      const result = await this.service.login({
        username,
        email,
        registerNumber,
        password,
        systemId,
      });

      AuthController.setAuthCookies(res, result.token, result.refreshToken);

      // Se preferir depender só dos cookies httpOnly, devolva apenas o essencial:
      //   return res.json({ userId: result.userId, credentialId: result.credentialId });
      return res.json(result);
    } catch (error: any) {
      return res.status(401).json({ message: error.message });
    }
  };

  /**
   * Renova o access token usando o refresh token do cookie (ou do corpo,
   * como fallback). Faz rotação: um novo refresh token é emitido.
   */
  refresh = async (req: RequestWithCookies, res: Response) => {
    const refreshToken =
      req.cookies?.[AuthController.REFRESH_COOKIE] ??
      req.body?.refreshToken ??
      null;

    try {
      const result = await this.service.refresh(refreshToken);

      AuthController.setAuthCookies(res, result.token, result.refreshToken);

      return res.json(result);
    } catch (error: any) {
      // Refresh inválido/expirado → limpa os cookies para forçar novo login.
      AuthController.clearAuthCookies(res);
      return res.status(401).json({ message: error.message });
    }
  };

  /** Logout: invalida a sessão no banco e remove os cookies. */
  logout = async (req: RequestWithCookies, res: Response) => {
    const refreshToken =
      req.cookies?.[AuthController.REFRESH_COOKIE] ??
      req.body?.refreshToken ??
      null;

    try {
      await this.service.logout(refreshToken);
    } finally {
      AuthController.clearAuthCookies(res);
    }

    return res.json({ message: "Logout efetuado." });
  };
}
