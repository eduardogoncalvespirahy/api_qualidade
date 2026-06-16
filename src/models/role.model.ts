export interface Role {
  id: string;
  systemId: string;
  nome: string;
  descricao: string | null;
  status: number;
  dataCriacao: Date;
  dataAlteracao: Date;
}

export interface CreateRoleDTO {
  systemId: string;
  nome: string;
  descricao?: string | null;
  status?: number;
}

export interface UpdateRoleDTO {
  systemId?: string;
  nome?: string;
  descricao?: string | null;
  status?: number;
}
