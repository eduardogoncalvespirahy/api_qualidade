export interface RepairerMachineAnswerResult {
  machineAnswerResultId: string;
  userId: string;
  dataCriacao: Date;
  observacao?: string;   
}

export interface CreateRepairerMachineAnswerResultDTO {
  machineAnswerResultId: string;
  userId: string;
  observacao?: string;   
}

export interface UpdateRepairerMachineAnswerResultDTO {
  machineAnswerResultId?: string;
  userId?: string;
  observacao?: string;   
}