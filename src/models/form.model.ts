export interface Form {
  id: string;
  sectionId: string;
  nome: string;
  descricao: string | null;
  status: number;
  dataCriacao: Date;
  dataAlteracao: Date;
}

export interface CreateFormDTO {
  sectionId: string;
  nome: string;
  descricao?: string | null;
  status?: number;
}

export interface UpdateFormDTO {
  sectionId?: string;
  nome?: string;
  descricao?: string | null;
  status?: number;
}
