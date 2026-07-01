import jwt from "jsonwebtoken";

export interface LoginDTO {
  username?: string;
  email?: string;
  registerNumber?: number;
  password: string;
  systemId?: string;
}

export interface LoginResponseDTO {
  userId: string;
  token: string;
  refreshToken: string;
}

export interface payloadUserLogin extends jwt.JwtPayload {
  id: string;
  credentialId: string;
  roles: string[];
}
