export interface RepairerAnswerResult {
  answerResultId: string;
  userId: string;
  dataCriacao: Date;
  observacao?: string; 
}

export interface CreateRepairerAnswerResultDTO {
  answerResultId: string;
  userId: string;
  observacao?: string;   
}

export interface UpdateRepairerAnswerResultDTO {
  answerResultId?: string;
  userId?: string;
  observacao?: string;   
}