export interface LimitAnswer {
  id: string;
  answerId: string;
  limitMax?: string | null;
  limitMin?: string | null;
  status: number;
  dataCriacao: Date;
  dataAlteracao: Date;
}

export interface CreateLimitAnswerDTO {
  answerId: string;
  limitMax?: string | null;
  limitMin?: string | null;
  status?: number;
}

export interface UpdateLimitAnswerDTO {
  answerId: string;
  limitMax?: string | null;
  limitMin?: string | null;
  status?: number;
}
