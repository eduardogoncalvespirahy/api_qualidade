import crypto from "crypto";
import jwt from "jsonwebtoken";

import { UserRepository } from "../repositories/user.repository";
import { CredentialRepository } from "../repositories/credential.repository";
import { CredentialRoleRepository } from "../repositories/credentialRole.repository";
import { SessionRepository } from "../repositories/session.repository";
import { FaceService } from "../services/face/face.service";

import { LoginResponseDTO } from "../models/auth.model";
import { JwtPayload } from "../models/jwt.model";

const REFRESH_TTL_DAYS = 7;

export interface FaceLoginDTO {
  username?: string;
  email?: string;
  registerNumber?: number;
  systemId?: string;
  image: string; // base64 ou data URL
}

export class FaceAuthService {
  private readonly users = new UserRepository();
  private readonly credentials = new CredentialRepository();
  private readonly credentialRoles = new CredentialRoleRepository();
  private readonly sessions = new SessionRepository();
  private readonly face = new FaceService();

  async login(dto: FaceLoginDTO): Promise<Partial<LoginResponseDTO>> {
    if (!dto.image) {
      throw new Error("Imagem é obrigatória");
    }

    const user = dto.email
      ? await this.users.findByEmail(dto.email)
      : dto.username
      ? await this.users.findByUsername(dto.username)
      : dto.registerNumber !== undefined
      ? await this.users.findByRegisterNumber(dto.registerNumber)
      : null;

    if (!user) {
      throw new Error("Credenciais inválidas");
    }

    // prova biométrica: a selfie precisa bater com o rosto cadastrado
    const { match } = await this.face.verify(user.id, dto.image);
    if (!match) {
      throw new Error("Rosto não reconhecido");
    }

    const credential = dto.systemId
      ? await this.credentials.findByUserAndSystem(user.id, dto.systemId)
      : (await this.credentials.findByUserId(user.id))[0] ?? null;

    if (!credential) {
      throw new Error("Credenciais inválidas");
    }

    const roles = await this.credentialRoles.findRoleNamesByCredential(
      credential.id,
    );

    const payload: JwtPayload = {
      id: user.id,
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
