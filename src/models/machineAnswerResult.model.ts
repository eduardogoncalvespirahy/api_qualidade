export interface MachineAnswerResult {
  id: string,
  machineId: string;
  machineAnswerId: string;
  controlId: string;
  resposta: string;
  limitsAnswerId: string | null;
  dataCriacao: Date;
  dataAlteracao: Date;
}

export interface CreateMachineAnswerResultDTO {
  machineId: string;
  machineAnswerId: string;
  controlId: string;
  resposta: string;
  limitsAnswerId?: string | null;
  dataCriacao?: Date;
  dataAlteracao?: Date;
}

export interface UpdateMachineAnswerResultDTO {
  machineId: string;
  machineAnswerId: string;
  controlId: string;
  resposta: string;
  limitsAnswerId?: string | null;
  dataCriacao?: Date;
  dataAlteracao?: Date;
}
