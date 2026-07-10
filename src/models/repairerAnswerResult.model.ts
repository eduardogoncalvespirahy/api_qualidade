export interface RepairerAnswerResult {
  answerResultId: string;
  userId: string;
  dataCriacao: Date;
}

export interface CreateRepairerAnswerResultDTO {
  answerResultId: string;
  userId: string;
}

export interface UpdateRepairerAnswerResultDTO {
  answerResultId?: string;
  userId?: string;
}