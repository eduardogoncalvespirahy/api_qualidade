export interface MachineAnswerResult {
  id: string,
  machineId: string;
  answerId: string;
  controlId: string;
  resposta: string;
  limitsAnswerId: string | null;
  dataCriacao: Date;
  dataAlteracao: Date;
}

export interface CreateMachineAnswerResultDTO {
  machineId: string;
  answerId: string;
  controlId: string;
  resposta: string;
  limitsAnswerId?: string | null;
  dataCriacao?: Date;
  dataAlteracao?: Date;
}

export interface UpdateMachineAnswerResultDTO {
  machineId: string;
  answerId: string;
  controlId: string;
  resposta: string;
  limitsAnswerId?: string | null;
  dataCriacao?: Date;
  dataAlteracao?: Date;
}
