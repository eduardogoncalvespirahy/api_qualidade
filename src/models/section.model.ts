export interface Section {
  id: string;
  employerId: string;
  nome: string;
  descricao: string | null;
  status: number;
  dataCriacao: Date;
  dataAlteracao: Date;
}

export interface CreateSectionDTO {
  employerId: string;
  nome: string;
  descricao?: string | null;
  status?: number;
}

export interface UpdateSectionDTO {
  employerId?: string;
  nome?: string;
  descricao?: string | null;
  status?: number;
}
