export interface Location {
  id: string;
  employerId: string;
  nome: string;
  descricao: string | null;
  status: number;
  dataCriacao: Date;
  dataAlteracao: Date;
}

export interface CreateLocationDTO {
  employerId: string;
  nome: string;
  descricao?: string | null;
  status?: number;
}

export interface UpdateLocationDTO {
  employerId?: string;
  nome?: string;
  descricao?: string | null;
  status?: number;
}
