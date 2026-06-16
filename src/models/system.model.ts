export interface System {
  id: string;
  nome: string;
  descricao: string | null;
  url: string | null;
  status: number;
  dataCriacao: Date;
  dataAlteracao: Date;
}

export interface CreateSystemDTO {
  nome: string;
  descricao?: string | null;
  url?: string | null;
  status?: number;
}

export interface UpdateSystemDTO {
  nome?: string;
  descricao?: string | null;
  url?: string | null;
  status?: number;
}
