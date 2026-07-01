export interface JwtPayload {
  id: string;
  roles: string[];
  iat?: number;
  exp?: number;
}
