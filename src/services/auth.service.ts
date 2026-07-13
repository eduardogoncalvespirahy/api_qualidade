import dotenv from "dotenv";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import { UserRepository } from "../repositories/user.repository";
import { CredentialRepository } from "../repositories/credential.repository";
import { CredentialRoleRepository } from "../repositories/credentialRole.repository";
import { SessionRepository } from "../repositories/session.repository";

import { LoginDTO, LoginResponseDTO } from "../models/auth.model";
import { JwtPayload } from "../models/jwt.model";

dotenv.config();

const SYSTEM_ID = String(process.env.SYSTEM_ID);
const REFRESH_TTL_DAYS = 7;

export class AuthService {
  private readonly users: UserRepository;
  private readonly credentials: CredentialRepository;
  private readonly credentialRoles: CredentialRoleRepository;
  private readonly sessions: SessionRepository;

  constructor() {
    this.users = new UserRepository();
    this.credentials = new CredentialRepository();
    this.credentialRoles = new CredentialRoleRepository();
    this.sessions = new SessionRepository();
  }

  async login(dto: LoginDTO): Promise<LoginResponseDTO> {
    const user = dto.email
      ? await this.users.findByEmail(dto.email)
      : dto.username
        ? await this.users.findByUsername(dto.username)
        : dto.registerNumber !== undefined
          ? await this.users.findByRegisterNumber(dto.registerNumber)
          : null;

    if (!user) {
      throw new Error(
        `Usuario ${dto.email ?? dto.username ?? dto.registerNumber} não encontrado`,
      );
    }

    // dto.systemId = dto.systemId ? dto.systemId : String(SYSTEM_ID);

    const credential = dto.systemId
      ? await this.credentials.findByUserAndSystem(user.id, dto.systemId)
      : ((await this.credentials.findByUserId(user.id))[0] ?? null);

    if (!credential) {
      throw new Error("Credenciais inválidas");
    }

    const validPassword = await bcrypt.compare(
      dto.password,
      credential.senhaHash,
    );
    if (!validPassword) {
      throw new Error("Credenciais inválidas");
    }

    const roles = await this.credentialRoles.findRoleNamesByCredential(
      credential.id,
    );

    const token = this.signAccessToken(user.id, roles);
    const refreshToken = await this.createSession(credential.id);

    await this.credentials.touchLastLogin(credential.id);

    return {
      userId: user.id,
      credentialId: credential.id,
      token,
      refreshToken,
    };
  }

  /**
   * Emite um novo access token a partir de um refresh token válido.
   * Faz ROTAÇÃO: o refresh recebido é invalidado e um novo é gerado. Assim,
   * se um refresh vazar, ele deixa de valer assim que for usado uma vez.
   */
  async refresh(refreshToken?: string | null): Promise<LoginResponseDTO> {
    if (!refreshToken) {
      throw new Error("Refresh token ausente");
    }

    const session = await this.sessions.findByRefreshToken(refreshToken);
    if (!session) {
      throw new Error("Sessão inválida");
    }

    // Expirou? remove a sessão e recusa.
    if (new Date(session.expira).getTime() <= Date.now()) {
      await this.sessions.deleteByRefreshToken(refreshToken);
      throw new Error("Sessão expirada");
    }

    const credential = await this.credentials.findById(session.credentialId);
    if (!credential) {
      // Sessão órfã: limpa e recusa.
      await this.sessions.deleteByRefreshToken(refreshToken);
      throw new Error("Credencial não encontrada");
    }

    const user = await this.users.findById(credential.userId);
    if (!user) {
      await this.sessions.deleteByRefreshToken(refreshToken);
      throw new Error("Usuário não encontrado");
    }

    const roles = await this.credentialRoles.findRoleNamesByCredential(
      credential.id,
    );

    const token = this.signAccessToken(user.id, roles);

    // Rotação: invalida o refresh atual e cria um novo.
    await this.sessions.deleteByRefreshToken(refreshToken);
    const newRefreshToken = await this.createSession(credential.id);

    await this.credentials.touchLastLogin(credential.id);

    return {
      userId: user.id,
      credentialId: credential.id,
      token,
      refreshToken: newRefreshToken,
    };
  }

  /** Logout: invalida a sessão associada ao refresh token (se existir). */
  async logout(refreshToken?: string | null): Promise<void> {
    if (refreshToken) {
      await this.sessions.deleteByRefreshToken(refreshToken);
    }
  }

  // ───────── helpers ─────────

  /** Assina o JWT de acesso (mesma regra do login: expira em 1 dia). */
  private signAccessToken(userId: string, roles: string[]): string {
    const payload: JwtPayload = { id: userId, roles };
    return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "1d" });
  }

  /** Cria uma sessão nova (refresh token opaco) e devolve o token gerado. */
  private async createSession(credentialId: string): Promise<string> {
    const refreshToken = crypto.randomBytes(48).toString("hex");
    const expira = new Date();
    expira.setDate(expira.getDate() + REFRESH_TTL_DAYS);

    await this.sessions.create({
      credentialId,
      refreshtoken: refreshToken,
      expira,
    });

    return refreshToken;
  }
}
