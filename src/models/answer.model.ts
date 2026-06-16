export interface Answer {
  id: string;
  formId: string;
  nome: string;
  descricao: string | null;
  status: number;
  dataCriacao: Date;
  dataAlteracao: Date;
}

export interface CreateAnswerDTO {
  formId: string;
  nome: string;
  descricao?: string | null;
  status?: number;
}

export interface UpdateAnswerDTO {
  formId?: string;
  nome?: string;
  descricao?: string | null;
  status?: number;
}
