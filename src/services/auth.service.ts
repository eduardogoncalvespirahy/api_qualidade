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
      throw new Error(`Usuario ${dto.email??dto.username??dto.registerNumber} não encontrado`);
    }

    // dto.systemId = dto.systemId ? dto.systemId : String(SYSTEM_ID);

    const credential = dto.systemId
      ? await this.credentials.findByUserAndSystem(user.id, dto.systemId)
      : (await this.credentials.findByUserId(user.id))[0] ?? null;

    if (!credential) {
      throw new Error("Credenciais inválidas");
    }

    const validPassword = await bcrypt.compare(dto.password, credential.senhaHash);
    if (!validPassword) {
      throw new Error("Credenciais inválidas");
    }

    const roles = await this.credentialRoles.findRoleNamesByCredential(credential.id);

    const payload: JwtPayload = {
      id: user.id,
      credentialId: credential.id,
      roles,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "1d",
    });

    const refreshToken = crypto.randomBytes(48).toString("hex");
    const expira = new Date();
    expira.setDate(expira.getDate() + REFRESH_TTL_DAYS);

    await this.sessions.create({
      credentialId: credential.id,
      refreshtoken: refreshToken,
      expira,
    });

    await this.credentials.touchLastLogin(credential.id);

    return { token, refreshToken };
  }
}
