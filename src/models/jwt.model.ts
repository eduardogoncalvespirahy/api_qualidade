export interface JwtPayload {
  id: string;
  credentialId: string;
  roles: string[];
  iat?: number;
  exp?: number;
}
