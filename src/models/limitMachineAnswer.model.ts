export interface LimitMachineAnswer {
  id: string;
  machineId: string;
  limitMax: string | null;
  limitMin: string | null;
  status: number;
  dataCriacao: Date;
  dataAlteracao: Date;
}

export interface CreateLimitMachineAnswerDTO {
  machineId: string;
  limitMax?: string | null;
  limitMin?: string | null;
  status?: number;
}

export interface UpdateLimitMachineAnswerDTO {
  machineId: string;
  limitMax?: string | null;
  limitMin?: string | null;
  status?: number;
}
