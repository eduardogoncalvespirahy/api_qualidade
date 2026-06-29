export interface AnswerGroups {
  id: string;
  formId: string;
  nome: string;
  descricao: string | null;
  status: number;
  dataCriacao: Date;
  dataAlteracao: Date;
}

export interface CreateAnswerGroupsDTO {
  formId?: string;
  nome?: string;
  descricao?: string | null;
  status?: number;
}

export interface UpdateAnswerGroupsDTO {
  formId?: string;
  nome?: string;
  descricao?: string | null;
  status?: number;
}
