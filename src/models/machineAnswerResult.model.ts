export interface MachineAnswerResult {
  id: string;
  machineAnswerId: string;
  resposta: string | null;
}

export interface CreateMachineAnswerResultDTO {
  machineAnswerId: string;
  resposta?: string | null;
}

export interface UpdateMachineAnswerResultDTO {
  machineAnswerId: string;
  resposta?: string | null;
}
