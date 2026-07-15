export interface RepairerMachineAnswerResult {
  machineAnswerResultId: string;
  userId: string;
  dataCriacao: Date;
}

export interface CreateRepairerMachineAnswerResultDTO {
  machineAnswerResultId: string;
  userId: string;
}

export interface UpdateRepairerMachineAnswerResultDTO {
  machineAnswerResultId?: string;
  userId?: string;
}