export interface CategorieAnswer {
  id: string;
  nome: string;
  descricao: string | null;
  status: number;
  dataCriacao: Date;
  dataAlteracao: Date;
}

export interface CreateCategorieAnswerDTO {
  nome?: string;
  descricao?: string | null;
  status?: number;
}

export interface UpdateCategorieAnswerDTO {
  nome?: string;
  descricao?: string | null;
  status?: number;
}
