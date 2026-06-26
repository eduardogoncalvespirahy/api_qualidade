export interface AnswerResult {
  id: string,
  AnswerId: string;
  resposta: string;
  limitsAnswerId: string | null;
  dataCriacao: Date;
  dataAlteracao: Date;
}

export interface CreateAnswerResultDTO {
  AnswerId: string;
  resposta: string;
  limitsAnswerId?: string | null;
  dataCriacao?: Date;
  dataAlteracao?: Date;
}

export interface UpdateAnswerResultDTO {
  id: string;
  AnswerId: string;
  resposta: string;
  limitsAnswerId?: string | null;
  dataCriacao?: Date;
  dataAlteracao?: Date;
}
