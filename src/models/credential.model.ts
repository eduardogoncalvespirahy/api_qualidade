export interface Credential {
  id: string;
  userId: string;
  systemId: string;
  senhaHash: string;
  status: number;
  dataUltimoLogin: Date;
  dataCriacao: Date;
  dataAlteracao: Date;
}

export interface CredentialResponse {
  id: string;
  userId: string;
  systemId: string;
  status: number;
  dataUltimoLogin: Date;
  dataCriacao: Date;
  dataAlteracao: Date;
}

export interface CreateCredentialDTO {
  userId: string;
  systemId: string;
  senha: string;
  status?: number;
}

export interface UpdateCredentialDTO {
  senha?: string;
  status?: number;
}
