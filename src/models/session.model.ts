export interface Session {
  id: string;
  credentialId: string;
  refreshtoken: string;
  expira: Date;
  revogado: boolean;
  dataCriacao: Date;
  dataAlteracao: Date;
}

export interface CreateSessionDTO {
  credentialId: string;
  refreshtoken: string;
  expira: string | Date;
}
